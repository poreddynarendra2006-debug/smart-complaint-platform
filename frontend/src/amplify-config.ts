'use client';

import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_IqcnzYcey',
      userPoolClientId: '22ldht802dlpcgofr2btj6a8t5',
      loginWith: {
        email: true,
      },
    },
  },
});

console.log('Amplify configured');

export {};