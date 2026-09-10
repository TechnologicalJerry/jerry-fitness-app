export interface IdentityProviderUser {
  externalId: string;
  email: string;
  firstName: string;
  lastName: string;
  groups?: string[];
}

export interface OrganizationIdentityProviderConfig {
  providerType: 'OIDC' | 'SAML' | 'GOOGLE_WORKSPACE' | 'MICROSOFT_ENTRA' | 'OKTA';
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  metadataXml?: string;
  domainName?: string;
}

export interface OrganizationIdentityProvider {
  getProviderType(): string;
  authenticateCallback(codeOrSAMLResponse: string): Promise<IdentityProviderUser>;
  getAuthorizationUrl(organizationId: string, redirectUri: string): Promise<string>;
  validateToken(token: string): Promise<IdentityProviderUser>;
}

export class MockEnterpriseIdentityProvider implements OrganizationIdentityProvider {
  constructor(private readonly config: OrganizationIdentityProviderConfig) {}

  public getProviderType(): string {
    return this.config.providerType;
  }

  public async getAuthorizationUrl(organizationId: string, redirectUri: string): Promise<string> {
    return `${this.config.issuerUrl || 'https://sso.example.com'}/auth?org=${organizationId}&redirect=${encodeURIComponent(redirectUri)}`;
  }

  public async authenticateCallback(_codeOrSAMLResponse: string): Promise<IdentityProviderUser> {
    return {
      externalId: 'ext-sso-user-123',
      email: 'sso.user@enterprise.com',
      firstName: 'SSO',
      lastName: 'User',
      groups: ['employees'],
    };
  }

  public async validateToken(_token: string): Promise<IdentityProviderUser> {
    return {
      externalId: 'ext-sso-user-123',
      email: 'sso.user@enterprise.com',
      firstName: 'SSO',
      lastName: 'User',
    };
  }
}
