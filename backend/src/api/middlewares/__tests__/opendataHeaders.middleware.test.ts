/**
 * Tests unitaires pour opendataHeaders middleware
 * PR E - Export Open-Data Officiel
 */

import { Request, Response, NextFunction } from 'express';
import { opendataHeaders } from '../opendataHeaders.middleware';

describe('opendataHeaders middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let setHeaderMock: jest.Mock;

  beforeEach(() => {
    setHeaderMock = jest.fn();
    mockRequest = {};
    mockResponse = {
      setHeader: setHeaderMock,
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('devrait ajouter le header X-Data-License avec Etalab-2.0', () => {
    opendataHeaders(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(setHeaderMock).toHaveBeenCalledWith('X-Data-License', 'Etalab-2.0');
  });

  it('devrait ajouter le header X-Disclaimer', () => {
    opendataHeaders(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(setHeaderMock).toHaveBeenCalledWith(
      'X-Disclaimer',
      'Données statistiques sans qualification juridique',
    );
  });

  it('devrait ajouter le header Cache-Control avec cache public', () => {
    opendataHeaders(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(setHeaderMock).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600, s-maxage=3600',
    );
  });

  it('devrait ajouter le header Content-Type JSON', () => {
    opendataHeaders(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Type',
      'application/json; charset=utf-8',
    );
  });

  it('devrait appeler next() pour continuer la chaîne middleware', () => {
    opendataHeaders(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
  });

  it('devrait définir tous les headers obligatoires', () => {
    opendataHeaders(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // Vérifier que tous les headers obligatoires sont définis
    const headerCalls = setHeaderMock.mock.calls.map((call) => call[0]);

    expect(headerCalls).toContain('X-Data-License');
    expect(headerCalls).toContain('X-Disclaimer');
    expect(headerCalls).toContain('Cache-Control');
    expect(headerCalls).toContain('Content-Type');

    // Vérifier qu'on a exactement 4 headers
    expect(setHeaderMock).toHaveBeenCalledTimes(4);
  });

  it('devrait définir un cache valide de 1 heure', () => {
    opendataHeaders(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    const cacheControlCall = setHeaderMock.mock.calls.find(
      (call) => call[0] === 'Cache-Control',
    );

    expect(cacheControlCall).toBeDefined();
    expect(cacheControlCall![1]).toContain('public');
    expect(cacheControlCall![1]).toContain('max-age=3600');
    expect(cacheControlCall![1]).toContain('s-maxage=3600');
  });
});
