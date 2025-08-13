import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private secretMessage: string | null = null;

  getHello(): string {
    return 'Hello World!';
  }

  setSecretMessage(message: string) {
    this.secretMessage = message;
  }

  getSecretMessage() {
    return this.secretMessage;
  }
}
