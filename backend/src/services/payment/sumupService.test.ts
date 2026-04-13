/**
 * Unit tests for SumUpService
 */

import axios from 'axios';
import { SumUpService } from './sumupService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();

mockedAxios.create.mockReturnValue({
  get: mockGet,
  post: mockPost,
  delete: mockDelete,
} as unknown as ReturnType<typeof axios.create>);

describe('SumUpService', () => {
  let service: SumUpService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SumUpService();
  });

  describe('createCustomer', () => {
    it('should create a SumUp customer with name split into first/last', async () => {
      const mockCustomer = {
        customer_id: 'cust_123',
        personal_details: { email: 'test@example.com', first_name: 'Jean', last_name: 'Dupont' },
      };
      mockPost.mockResolvedValueOnce({ data: mockCustomer });

      const result = await service.createCustomer({
        email: 'test@example.com',
        name: 'Jean Dupont',
        userId: 'user_001',
      });

      expect(result).toEqual(mockCustomer);
      expect(mockPost).toHaveBeenCalledWith(
        '/customers',
        expect.objectContaining({
          personal_details: expect.objectContaining({
            email: 'test@example.com',
            first_name: 'Jean',
            last_name: 'Dupont',
          }),
        })
      );
    });

    it('should handle a single-word name', async () => {
      const mockCustomer = {
        customer_id: 'cust_456',
        personal_details: { email: 'user@example.com', first_name: 'Monique', last_name: '' },
      };
      mockPost.mockResolvedValueOnce({ data: mockCustomer });

      await service.createCustomer({
        email: 'user@example.com',
        name: 'Monique',
        userId: 'user_002',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/customers',
        expect.objectContaining({
          personal_details: expect.objectContaining({
            first_name: 'Monique',
            last_name: '',
          }),
        })
      );
    });
  });

  describe('createCheckout', () => {
    it('should create a checkout with required fields', async () => {
      const mockCheckout = {
        id: 'checkout_abc',
        checkout_reference: 'akiprisaye-user001-citizen_premium-1234',
        amount: 4.99,
        currency: 'EUR',
        status: 'PENDING',
      };
      mockPost.mockResolvedValueOnce({ data: mockCheckout });

      const result = await service.createCheckout({
        amount: 4.99,
        currency: 'EUR',
        description: 'Test Plan',
        checkoutReference: 'akiprisaye-user001-citizen_premium-1234',
      });

      expect(result).toEqual(mockCheckout);
      expect(mockPost).toHaveBeenCalledWith(
        '/checkouts',
        expect.objectContaining({
          amount: 4.99,
          currency: 'EUR',
          description: 'Test Plan',
        })
      );
    });

    it('should include affiliate_key when provided', async () => {
      mockPost.mockResolvedValueOnce({ data: { id: 'co_789' } });

      await service.createCheckout({
        amount: 49.90,
        currency: 'EUR',
        description: 'Annual plan',
        checkoutReference: 'ref-001',
        affiliateKey: 'sup_afk_test123',
      });

      expect(mockPost).toHaveBeenCalledWith(
        '/checkouts',
        expect.objectContaining({ affiliate_key: 'sup_afk_test123' })
      );
    });
  });

  describe('createSubscription', () => {
    it('should create a recurring subscription', async () => {
      const mockSub = {
        id: 'sub_001',
        customer_id: 'cust_123',
        plan_id: 'citizen_premium',
        status: 'ACTIVE',
        interval: 'monthly',
        amount: 4.99,
        currency: 'EUR',
      };
      mockPost.mockResolvedValueOnce({ data: mockSub });

      const result = await service.createSubscription({
        customerId: 'cust_123',
        planKey: 'citizen_premium',
        amount: 4.99,
        currency: 'EUR',
        interval: 'monthly',
        description: 'Citoyen Premium mensuel',
      });

      expect(result).toEqual(mockSub);
      expect(mockPost).toHaveBeenCalledWith(
        '/subscriptions',
        expect.objectContaining({
          customer_id: 'cust_123',
          plan_id: 'citizen_premium',
          amount: 4.99,
          interval: 'monthly',
        })
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should call DELETE on the subscription endpoint', async () => {
      mockDelete.mockResolvedValueOnce({});

      await service.cancelSubscription('sub_001');

      expect(mockDelete).toHaveBeenCalledWith('/subscriptions/sub_001');
    });
  });

  describe('generateCheckoutReference', () => {
    it('should generate a unique checkout reference', () => {
      const ref = service.generateCheckoutReference('user123456', 'citizen_premium', 1000);
      expect(ref).toMatch(/^akiprisaye-user1234-citizen_premium-1000$/);
    });

    it('should use current timestamp when not provided', () => {
      const ref = service.generateCheckoutReference('user_abc', 'business_pro');
      expect(ref).toMatch(/^akiprisaye-user_abc-business_pro-\d+$/);
    });
  });
});
