import { Dispatch, SetStateAction } from 'react';
import { NavigateFunction } from 'react-router-dom';
import {
  IAddAddress,
  ISignUpData,
  ISignUpState,
} from '../../../interfaces/signup.interface';
import { errorNotify } from '../../../utils/ErrorPupUp';
import { successNotify } from '../../../utils/SuccessPopUp';
import { getCustometWithToken } from '../../../utils/getCustomer';
import { validateForm } from './Validate-Signup';
import { ICartQuantityContext } from '../../../interfaces/context.interface';

async function getCustomerToken(email: string, password: string) {
  const credentials = `${process.env.REACT_APP_CTP_CLIENT_ID}:${process.env.REACT_APP_CTP_CLIENT_SECRET}`;
  const encodedCredentials = btoa(credentials);
  try {
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
    const data = await response.json();
    const accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
}

async function getOauthToken(email: string, password: string) {
  const credentials = `${process.env.REACT_APP_CTP_CLIENT_ID}:${process.env.REACT_APP_CTP_CLIENT_SECRET}`;
  const encodedCredentials = btoa(credentials);

  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_AUTH_URL}/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${encodedCredentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          username: `${email}`,
          password: `${password}`,
        }),
      }
    );

    const data = await response.json();
    const accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Error fetching token:', error);
    throw error;
  }
}

async function setDefaultShippingAddress(
  addressId: string,
  version: string,
  signUpState: ISignUpState
) {
  const token = await getCustomerToken(
    signUpState.signUpData.email,
    signUpState.signUpData.password
  );

  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          version: version,
          actions: [
            {
              action: `setDefaultShippingAddress`,
              addressId: `${addressId}`,
            },
          ],
        }),
      }
    );

    if (response.ok) {
      console.log(`Shipping default address seted successfully`);
    } else {
      console.error(`Failed to set shipping default address`);
    }
  } catch (error) {
    console.error(`Error setting shipping default address:`, error);
  }
}

async function setDefaultBillingAddress(
  addressId: string,
  version: string,
  signUpState: ISignUpState
) {
  const token = await getCustomerToken(
    signUpState.signUpData.email,
    signUpState.signUpData.password
  );

  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          version: version,
          actions: [
            {
              action: `setDefaultBillingAddress`,
              addressId: `${addressId}`,
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (signUpState.signUpData.sameAddress) {
        setShippingAddress(
          data.addresses[0].id,
          data.version,
          'Shipping',
          signUpState
        );
      } else {
        addAddresses(
          signUpState.customerShippingAddress,
          data.version,
          signUpState
        );
      }
      console.log(`Billing default address seted successfully`);
    } else {
      console.error(`Failed to set billing default address`);
    }
  } catch (error) {
    console.error(`Error setting billing default address:`, error);
  }
}

async function setShippingAddress(
  addressId: string,
  version: string,
  type: string,
  signUpState: ISignUpState
) {
  const token = await getCustomerToken(
    signUpState.signUpData.email,
    signUpState.signUpData.password
  );
  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          version: version,
          actions: [
            {
              action: `addShippingAddressId`,
              addressId: `${addressId}`,
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (signUpState.defaultShippingAddress) {
        setDefaultShippingAddress(addressId, data.version, signUpState);
      }
      console.log(`${type} seted successfully`);
    } else {
      console.error(`Failed to set ${type}`);
    }
  } catch (error) {
    console.error(`Error setting ${type}:`, error);
  }
}

async function setBillingAddress(
  addressId: string,
  version: string,
  type: string,
  signUpState: ISignUpState
) {
  const token = await getCustomerToken(
    signUpState.signUpData.email,
    signUpState.signUpData.password
  );
  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          version: version,
          actions: [
            {
              action: `addBillingAddressId`,
              addressId: `${addressId}`,
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (signUpState.defaultBillingAddress) {
        setDefaultBillingAddress(addressId, data.version, signUpState);
      } else {
        if (signUpState.signUpData.sameAddress) {
          setShippingAddress(
            data.addresses[0].id,
            data.version,
            'Shipping',
            signUpState
          );
        } else {
          addAddresses(
            signUpState.customerShippingAddress,
            data.version,
            signUpState
          );
        }
      }
      console.log(`${type} seted successfully`);
    } else {
      console.error(`Failed to set ${type}`);
    }
  } catch (error) {
    console.error(`Error setting ${type}:`, error);
  }
}

async function addAddresses(
  { streetName, postalCode, city, country, type }: IAddAddress,
  version: number,
  signUpState: ISignUpState
) {
  const token = await getCustomerToken(
    signUpState.signUpData.email,
    signUpState.signUpData.password
  );

  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          version: version,
          actions: [
            {
              action: 'addAddress',
              address: {
                streetName: `${streetName}`,
                postalCode: `${postalCode}`,
                city: `${city}`,
                country: `${country}`,
              },
            },
          ],
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Addresses added successfully');
      if (type === 'Billing') {
        setBillingAddress(
          data.addresses[0].id,
          data.version,
          type,
          signUpState
        );
      }
      if (type === 'Shipping' && !signUpState.signUpData.sameAddress) {
        setShippingAddress(
          data.addresses[1].id,
          data.version,
          type,
          signUpState
        );
      }
    } else {
      console.error(`Failed to add addresses ${type}`);
    }
  } catch (error) {
    console.error(`Error adding addresses ${type}:`, error);
  }
}

export async function handleSubmit(
  event: React.FormEvent,
  signUpState: ISignUpState,
  setErrors: Dispatch<SetStateAction<Partial<ISignUpData>>>,
  navigate: NavigateFunction,
  setIsAuth: (newState: boolean) => void,
  setCartQuantity: ICartQuantityContext['setCartQuantity']
): Promise<number | void> {
  event.preventDefault();
  if (validateForm(setErrors, signUpState)) {
    try {
      const customerSinUpInfo = {
        email: signUpState.signUpData.email,
        password: signUpState.signUpData.password,
        firstName: signUpState.signUpData.firstName,
        lastName: signUpState.signUpData.lastName,
        dateOfBirth: signUpState.signUpData.bd,
      };

      const token = await getOauthToken(
        customerSinUpInfo.email,
        customerSinUpInfo.password
      );

      const response = await fetch(
        `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(customerSinUpInfo),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCartQuantity(0);
        addAddresses(
          signUpState.customerBillingAddress,
          data.customer.version,
          signUpState
        );
        successNotify(
          'Congratulatoins, yor account has been successfully created'
        );
        setTimeout(() => {
          getCustometWithToken(
            {
              email: signUpState.signUpData.email,
              password: signUpState.signUpData.password,
            },
            navigate,
            setIsAuth,
            setCartQuantity
          );
        }, 3000);
        console.log('Customer created successfully');
      } else {
        if (data.statusCode === 400) {
          errorNotify(
            `${data.message}, you can log in or use another email address`
          );
        }
        console.error('Failed to create customer');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  }
}
