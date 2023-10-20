import {
  IDataCustomer,
  IDataForm,
  ITokenData,
} from '../../../interfaces/auth.interface';
import { scheduleTokenRefresh } from '../../../utils/refreshToken';

const clientId = process.env.REACT_APP_CTP_CLIENT_ID;
const clientSecret = process.env.REACT_APP_CTP_CLIENT_SECRET;
const credentials = `${clientId}:${clientSecret}`;
const encodedCredentials = btoa(credentials);

export const getCustomer = async ({
  accessToken,
  email,
  password,
}: Partial<IDataCustomer>) => {
  try {
    scheduleTokenRefresh();
    const object = {
      email: `${email}`,
      password: `${password}`,
    };
    const response = await fetch(
      `${process.env.REACT_APP_CTP_API_URL}/angel_team/me/login`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(object),
      }
    );

    return response.json();
  } catch (error) {
    console.error('Error getting customer:', error);
  }
};

export const getToken = async ({
  email,
  password,
}: IDataForm): Promise<ITokenData> => {
  try {
    scheduleTokenRefresh();
    const response = await fetch(
      `${process.env.REACT_APP_CTP_AUTH_URL}/oauth/angel_team/customers/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: `${email}`,
          password: `${password}`,
        }),
      }
    );
    return response.json();
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

export const refreshToken = async ({
  refreshToken,
}: Partial<IDataCustomer>) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_AUTH_URL}/oauth/token`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: `${refreshToken}`,
        }),
      }
    );
    return response.json();
  } catch (error) {
    console.error('Error getting refresh token:', error);
    throw error;
  }
};
