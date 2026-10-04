import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const userRole = event.request.userAttributes['custom:role'];
  
  // Default to Customer, or DeliveryBoy if explicitly selected. Never auto-assign Admin.
  let groupName = 'Customer';
  if (userRole === 'DeliveryBoy') {
    groupName = 'DeliveryBoy';
  }

  const command = new AdminAddUserToGroupCommand({
    GroupName: groupName,
    UserPoolId: event.userPoolId,
    Username: event.userName,
  });

  try {
    await client.send(command);
  } catch (error) {
    console.error(`Failed to add user ${event.userName} to group ${groupName}:`, error);
    throw error;
  }

  return event;
};
