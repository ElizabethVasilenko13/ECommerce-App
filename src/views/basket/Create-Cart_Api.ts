import { ICartQuantityContext } from '../../interfaces/context.interface';
import { expiredInSeconds } from '../../utils/consts';
import { scheduleTokenRefresh } from '../../utils/refreshToken';

export async function checkActiveCart(
  setCartQuantity: ICartQuantityContext['setCartQuantity']
) {
  try {
    await scheduleTokenRefresh();
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      const response = await fetch(
        `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me/active-cart`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('cartData', JSON.stringify(data));
        setCartQuantity(data.totalLineItemQuantity || 0);

        const itemCart: string[] = [];
        for(let i = 0; i < data.lineItems.length; i+= 1) {
          itemCart.push(data.lineItems[i].productId)
        }

        localStorage.setItem('cartItem', JSON.stringify(itemCart))
      } else if (data.statusCode === 404) {
        createNewCart();
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export async function createNewCart() {
  try {
    await scheduleTokenRefresh();
    const getIsAuth = localStorage.getItem('isAuth') === 'true';
    const authToken = getIsAuth
      ? localStorage.getItem('authToken')
      : localStorage.getItem('anonToken');

    if (authToken) {
      const response = await fetch(
        `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me/carts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            currency: 'USD',
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        const itemCart: string[] = [];
        for(let i = 0; i < data.lineItems.length; i+= 1) {
          itemCart.push(data.lineItems[i].productId)
        }

        getIsAuth
        ? (localStorage.setItem('cartData', JSON.stringify(data)), localStorage.setItem('cartItem', JSON.stringify(itemCart)))
        : (localStorage.setItem('anonCartData', JSON.stringify(data)), localStorage.setItem('anonCartItem', JSON.stringify(itemCart)));
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export async function updateCart(
  productId: string,
  setCartQuantity: ICartQuantityContext['setCartQuantity']
) {
  const getIsAuth = localStorage.getItem('isAuth') === 'true';
  const cartData = getIsAuth
    ? JSON.parse(localStorage.getItem('cartData') || '')
    : JSON.parse(localStorage.getItem('anonCartData') || '');
  try {
    await scheduleTokenRefresh();
    const authToken = getIsAuth
      ? localStorage.getItem('authToken')
      : localStorage.getItem('anonToken');

    if (authToken) {
      const response = await fetch(
        `${process.env.REACT_APP_CTP_API_URL}/${process.env.REACT_APP_CTP_PROJECT_KEY}/me/carts/${cartData.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            version: cartData.version,
            actions: [
              {
                action: 'addLineItem',
                productId: productId,
                variantId: 1,
                quantity: 1,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setCartQuantity(data.totalLineItemQuantity);

        const itemCart: string[] = [];
        for(let i = 0; i < data.lineItems.length; i+= 1) {
          itemCart.push(data.lineItems[i].productId)
        }

        getIsAuth
        ? (localStorage.setItem('cartData', JSON.stringify(data)), localStorage.setItem('cartItem', JSON.stringify(itemCart)))
        : (localStorage.setItem('anonCartData', JSON.stringify(data)), localStorage.setItem('anonCartItem', JSON.stringify(itemCart)));
      }
    }
  } catch (error) {
    console.error(error);
  }
}

export async function getAnonToken() {
  const credentials = `${process.env.REACT_APP_CTP_CLIENT_ID}:${process.env.REACT_APP_CTP_CLIENT_SECRET}`;
  const encodedCredentials = btoa(credentials);

  try {
    const response = await fetch(
      `${process.env.REACT_APP_CTP_AUTH_URL}/oauth/angel_team/anonymous/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${encodedCredentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('anonToken', data.access_token);
      localStorage.setItem('refreshAnonToken', data.refresh_token);
      localStorage.setItem('expiredIn', `${Date.now() + expiredInSeconds}`);

      await createNewCart();
    }
  } catch (error) {
    console.error('Error fetching anon token:', error);
    throw error;
  }
}
