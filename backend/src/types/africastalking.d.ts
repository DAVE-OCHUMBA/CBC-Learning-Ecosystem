/**
 * Type declarations for africastalking module
 * The npm package doesn't include TypeScript definitions, so we define them here
 */

declare module 'africastalking' {
  interface SMS {
    send(options: {
      to: string[];
      message: string;
      enqueue?: boolean;
    }): Promise<{
      SMSMessageData: {
        Message: string;
        Recipients: Array<{
          statusCode: number;
          number: string;
          status: string;
          cost: string;
          messageId: string;
        }>;
      };
    }>;
  }

  interface Voice {
    call(options: {
      callFrom: string;
      callTo: string[];
    }): Promise<any>;

    fetchQuota(): Promise<any>;
  }

  interface USSD {
    send(options: {
      phoneNumber: string;
      message: string;
      sessionId: string;
      enqueue?: boolean;
    }): Promise<any>;
  }

  interface AfricasTalkingAPI {
    SMS: SMS;
    Voice: Voice;
    USSD: USSD;
  }

  interface Options {
    apiKey: string;
    username: string;
  }

  function AfricasTalking(options: Options): AfricasTalkingAPI;

  export = AfricasTalking;
}
