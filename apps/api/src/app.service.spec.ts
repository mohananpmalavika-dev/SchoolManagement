import { ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
describe('API readiness', () => {
  let prisma: any;
  let redis: any;
  let service: AppService;
  beforeEach(() => {
    prisma = {$queryRawUnsafe:jest.fn().mockResolvedValue([{one:1}])};
    redis = {ping:jest.fn().mockResolvedValue('PONG')};
    service = new AppService(prisma,redis);
  });
  it('reports ready only when the database and Redis respond', async () => {
    expect(await service.getDetailedHealth()).toMatchObject({status:'ok',checks:{database:'healthy',redis:'healthy'}});
  });
  it('keeps liveness independent of dependencies', () => {
    expect(service.getHealth()).toMatchObject({status:'ok'});
    expect(redis.ping).not.toHaveBeenCalled();
  });
  it.each(['database','redis'])('returns unavailable when %s fails', async dependency => {
    (dependency === 'database' ? prisma.$queryRawUnsafe : redis.ping).mockRejectedValue(new Error('Private infrastructure error'));
    await expect(service.getDetailedHealth()).rejects.toThrow(ServiceUnavailableException);
    await expect(service.getDetailedHealth()).rejects.not.toThrow('Private infrastructure error');
  });
  it('rejects an unexpected Redis response', async () => {
    redis.ping.mockResolvedValue('LOADING');
    await expect(service.getDetailedHealth()).rejects.toThrow(ServiceUnavailableException);
  });
  it('bounds unresponsive dependencies', async () => {
    jest.useFakeTimers();
    try {
      redis.ping.mockReturnValue(new Promise(()=>{}));
      const result = expect(service.getDetailedHealth()).rejects.toThrow(ServiceUnavailableException);
      await jest.advanceTimersByTimeAsync(3001);
      await result;
    } finally {jest.useRealTimers();}
  });
});
