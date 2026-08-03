import { Injectable, NotFoundException } from '@nestjs/common';
import { IdentityProvider } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface ResolveIdentityDto {
  provider: IdentityProvider;
  identifier: string;
  displayName?: string;
  avatarUrl?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves or creates a Universal Identity bound to a channel identifier (Telegram ID, WhatsApp #, etc.).
   */
  async resolveOrCreateIdentity(dto: ResolveIdentityDto) {
    const existingChannel = await this.prisma.channelIdentity.findUnique({
      where: {
        provider_identifier: {
          provider: dto.provider,
          identifier: dto.identifier,
        },
      },
      include: { identity: true },
    });

    if (existingChannel) {
      return existingChannel.identity;
    }

    // Create new Universal Identity & bound channel identity
    const identity = await this.prisma.universalIdentity.create({
      data: {
        displayName: dto.displayName || `${dto.provider}_${dto.identifier}`,
        avatarUrl: dto.avatarUrl,
        channels: {
          create: {
            provider: dto.provider,
            identifier: dto.identifier,
            metadata: dto.metadata || {},
          },
        },
      },
      include: { channels: true },
    });

    return identity;
  }

  /**
   * Links an additional channel (e.g. WhatsApp or Phone) to an existing Universal Identity.
   */
  async linkChannelToIdentity(identityId: string, provider: IdentityProvider, identifier: string, metadata?: Record<string, any>) {
    const identity = await this.prisma.universalIdentity.findUnique({ where: { id: identityId } });
    if (!identity) throw new NotFoundException('UNIVERSAL_IDENTITY_NOT_FOUND');

    return this.prisma.channelIdentity.create({
      data: {
        identityId,
        provider,
        identifier,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Gets a Universal Identity with all connected channels and notes.
   */
  async getIdentityDetails(identityId: string) {
    const identity = await this.prisma.universalIdentity.findUnique({
      where: { id: identityId },
      include: {
        channels: true,
        adminNotes: true,
        supportCases: true,
      },
    });
    if (!identity) throw new NotFoundException('UNIVERSAL_IDENTITY_NOT_FOUND');
    return identity;
  }
}
