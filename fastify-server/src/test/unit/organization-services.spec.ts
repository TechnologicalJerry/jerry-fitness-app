import { describe, it, expect } from 'vitest';
import { organizationService } from '../../modules/organizations/services/organization.service';
import { invitationService } from '../../modules/organizations/services/invitation.service';
import { MockEnterpriseIdentityProvider } from '../../modules/organizations/services/identity-provider.interface';

describe('Stage 16 — Organization Services Unit Tests', () => {
  describe('Organization Slug & Personal Workspace Helper', () => {
    it('should generate clean slugs from organization names', () => {
      const slug = (organizationService as any).generateSlug('  My Apex Fitness Gym & Studio!!  ');
      expect(slug).toBe('my-apex-fitness-gym-studio');
    });

    it('should fallback to default slug if input has special characters only', () => {
      const slug = (organizationService as any).generateSlug('!!!', '123');
      expect(slug).toBe('organization-123');
    });
  });

  describe('MockEnterpriseIdentityProvider', () => {
    it('should support SAML/OIDC identity provider configuration', async () => {
      const provider = new MockEnterpriseIdentityProvider({
        providerType: 'OIDC',
        issuerUrl: 'https://sso.enterprise.org',
      });

      expect(provider.getProviderType()).toBe('OIDC');
      const authUrl = await provider.getAuthorizationUrl('org-99', 'https://app.jerryfitness.com/callback');
      expect(authUrl).toContain('https://sso.enterprise.org/auth?org=org-99');

      const user = await provider.authenticateCallback('mock-code');
      expect(user.email).toBe('sso.user@enterprise.com');
    });
  });

  describe('Invitation Service Token Hashing', () => {
    it('should deterministically hash raw invitation tokens using SHA-256', () => {
      const token1 = 'my-secret-invitation-token-123';
      const hash1 = (invitationService as any).hashToken(token1);
      const hash2 = (invitationService as any).hashToken(token1);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // hex sha256 length
    });
  });
});
