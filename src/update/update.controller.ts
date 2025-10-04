/**
 * Update Controller for 4Paws Backend
 * Handles update check and trigger from frontend
 */

import { Controller, Get, Post, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('update')
export class UpdateController {
  private readonly agentUrl: string;

  constructor(private configService: ConfigService) {
    this.agentUrl = this.configService.get<string>('AGENT_URL') || 'http://localhost:5000';
  }

  @Get('check')
  async checkUpdate() {
    try {
      const response = await fetch(`${this.agentUrl}/api/update/check`);
      
      if (!response.ok) {
        throw new HttpException(
          'Agent not available or check failed',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Agent not available',
          message: error.message
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Post('start')
  async startUpdate() {
    try {
      const response = await fetch(`${this.agentUrl}/api/update/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component: 'all' })
      });

      if (!response.ok) {
        throw new HttpException(
          'Failed to start update',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const data = await response.json();
      return {
        success: true,
        ...data
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Failed to start update',
          message: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  async getUpdateStatus() {
    try {
      // Get current versions from agent
      const response = await fetch(`${this.agentUrl}/api/status`);
      
      if (!response.ok) {
        throw new HttpException(
          'Agent not available',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      const data = await response.json();
      return {
        success: true,
        versions: data.versions
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Agent not available',
          message: error.message
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}

