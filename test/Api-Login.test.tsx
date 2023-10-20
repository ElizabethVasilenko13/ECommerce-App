import { getCustomer } from '../src/views/authorization/log-in/Api-Login';
import fetchMock from 'jest-fetch-mock';

const mockConsoleError = jest.spyOn(console, 'error');

const accessToken = 'Angelina';
const email = 'Angelina@example.com';
const password = 'Angelinapass';

fetchMock.enableMocks();

describe('functions Api data getCustomers', () => {
  it('fetch successfully data from an API', async () => {
    const mockResponse = { someKey: 'someValue' };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await getCustomer({ accessToken, email, password });

    expect(result).toEqual(mockResponse);
    expect(fetchMock).toHaveBeenCalledWith(
      `${process.env.REACT_APP_CTP_API_URL}/angel_team/me/login`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email, password }),
      })
    );
  });

  it('handles errors', async () => {
    fetchMock.mockRejectOnce(new Error('Error'));

    const result = await getCustomer({ accessToken, email, password });
    expect(result).toBeUndefined();
    expect(mockConsoleError).toHaveBeenCalledWith('Error getting customer:', expect.any(Error));
  });
});
