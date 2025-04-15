import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.header('x-user-id');

    if (!userId) {
      throw new UnauthorizedException('Missing user ID in headers');
    }

    // Check if user exists and get role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user ID');
    }

    // Attach minimal user info to request
    request.user = {
      id: user.id,
      role: user.role
    };

    return true;
  }
} 