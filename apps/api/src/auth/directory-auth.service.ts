import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Client, type Entry } from 'ldapts';
import { Role } from './auth.types.js';

export type DirectoryIdentity = { directoryId: string; email: string; name: string; role: Role };

@Injectable()
export class DirectoryAuthService {
  private readonly logger = new Logger(DirectoryAuthService.name);

  enabled(environment: NodeJS.ProcessEnv = process.env) {
    return environment.AD_ENABLED?.trim().toLowerCase() === 'true';
  }

  async authenticate(email: string, password: string): Promise<DirectoryIdentity | null> {
    if (!this.enabled()) return null;
    const config = this.config();
    const client = new Client({
      url: config.url,
      timeout: config.timeout,
      connectTimeout: config.timeout,
    });
    try {
      await client.bind(config.bindDn, config.bindPassword);
      const { searchEntries } = await client.search(config.baseDn, {
        scope: 'sub',
        filter: `(&${config.userFilter.replace('{email}', escapeFilter(email))}(objectClass=user))`,
        attributes: ['objectGUID', 'userPrincipalName', 'mail', 'displayName', 'cn', 'memberOf'],
        sizeLimit: 2,
      });
      if (searchEntries.length !== 1) return null;
      const entry = searchEntries[0];
      const groups = values(entry, 'memberOf').map((group) => group.toLowerCase());
      const role = this.roleForGroups(groups, config);
      if (!role) return null;
      await client.bind(entry.dn, password);
      return {
        directoryId: guid(entry.objectGUID) ?? entry.dn.toLowerCase(),
        email: value(entry, 'mail') ?? value(entry, 'userPrincipalName') ?? email,
        name: value(entry, 'displayName') ?? value(entry, 'cn') ?? email,
        role,
      };
    } catch (error) {
      if (isInvalidCredentials(error)) return null;
      this.logger.error({ event: 'directory_authentication_unavailable' });
      throw new ServiceUnavailableException('Serviço de autenticação institucional indisponível.');
    } finally {
      await client.unbind().catch(() => undefined);
    }
  }

  private roleForGroups(groups: string[], config: ReturnType<DirectoryAuthService['config']>) {
    const mappings: Array<[string | undefined, Role]> = [
      [config.adminGroup, Role.ADMIN],
      [config.editorGroup, Role.EDITOR],
      [config.journalistGroup, Role.JOURNALIST],
      [config.auditorGroup, Role.AUDITOR],
    ];
    return mappings.find(([group]) => group && groups.includes(group.toLowerCase()))?.[1] ?? null;
  }

  private config(environment: NodeJS.ProcessEnv = process.env) {
    const required = (key: string) => {
      const result = environment[key]?.trim();
      if (!result) throw new Error(`${key} é obrigatória quando AD_ENABLED=true.`);
      return result;
    };
    const url = required('AD_URL');
    if (!url.startsWith('ldaps://') && environment.NODE_ENV === 'production') {
      throw new Error('AD_URL deve usar ldaps:// em produção.');
    }
    const userFilter = environment.AD_USER_FILTER?.trim() || '(userPrincipalName={email})';
    if (!userFilter.includes('{email}')) throw new Error('AD_USER_FILTER deve conter {email}.');
    const timeout = Number(environment.AD_TIMEOUT_MS ?? 5000);
    if (!Number.isInteger(timeout) || timeout < 100 || timeout > 30_000) {
      throw new Error('AD_TIMEOUT_MS deve estar entre 100 e 30000.');
    }
    return {
      url,
      bindDn: required('AD_BIND_DN'),
      bindPassword: required('AD_BIND_PASSWORD'),
      baseDn: required('AD_BASE_DN'),
      userFilter,
      adminGroup: environment.AD_ADMIN_GROUP?.trim(),
      editorGroup: environment.AD_EDITOR_GROUP?.trim(),
      journalistGroup: environment.AD_JOURNALIST_GROUP?.trim(),
      auditorGroup: environment.AD_AUDITOR_GROUP?.trim(),
      timeout,
    };
  }
}

function escapeFilter(input: string) {
  return input.replace(
    /[\\()*\0]/g,
    (character) => `\\${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
  );
}

function value(entry: Entry, key: string) {
  const result = entry[key];
  return Array.isArray(result) ? String(result[0]) : result == null ? undefined : String(result);
}

function values(entry: Entry, key: string) {
  const result = entry[key];
  return result == null ? [] : (Array.isArray(result) ? result : [result]).map(String);
}

function guid(input: unknown) {
  if (!Buffer.isBuffer(input) || input.length !== 16) return undefined;
  const hex = input.toString('hex');
  return `${hex.slice(6, 8)}${hex.slice(4, 6)}${hex.slice(2, 4)}${hex.slice(0, 2)}-${hex.slice(10, 12)}${hex.slice(8, 10)}-${hex.slice(14, 16)}${hex.slice(12, 14)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isInvalidCredentials(error: unknown) {
  return (
    typeof error === 'object' && error !== null && 'code' in error && Number(error.code) === 49
  );
}
