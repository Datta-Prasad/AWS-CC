import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['Customer', 'DeliveryBoy', 'Admin'],
  userAttributes: {
    'custom:role': {
      dataType: 'String',
      mutable: true,
      minLen: 1,
      maxLen: 20,
    },
    'custom:fullName': {
      dataType: 'String',
      mutable: true,
      minLen: 1,
      maxLen: 100,
    },
  },
  triggers: {
    postConfirmation,
  },
  access: (allow) => [
    allow.resource(postConfirmation).to(['addUserToGroup']),
  ],
});
