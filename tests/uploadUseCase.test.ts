import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { UploadFileUseCase } from '#application/use-case/UploadFileUseCase.js';
import { File } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileStorage } from '#domain/repositories/fileStorage.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';

const PRESIGNED_URL = 'https://minio.example.com/files-bucket/video.mp4?X-Amz-Signature=abc';
const USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const FILE_SIZE = 1024;

const mockSave = jest.fn<FileRepository['save']>().mockResolvedValue(undefined);
const mockGetSignedURL = jest.fn<FileStorage['getSignedURL']>().mockResolvedValue(PRESIGNED_URL);
const mockSaveTag = jest.fn<FileTagRepository['saveTag']>().mockResolvedValue(undefined);

const mockRepo = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findByObjectKey: jest.fn(),
  getFiles: jest.fn(),
  save: mockSave,
  updateFileStatus: jest.fn(),
} as unknown as FileRepository;

const mockFileTagRepo = {
  findByTag: jest.fn(),
  getTag: jest.fn(),
  saveTag: mockSaveTag,
} as unknown as FileTagRepository;

const mockStorage = {
  download: jest.fn(),
  downloadFile: jest.fn(),
  getFilesBucket: jest.fn().mockReturnValue('files-bucket'),
  getSignedURL: mockGetSignedURL,
  getThumbnailsBucket: jest.fn(),
  getVideosBucket: jest.fn(),
  upload: jest.fn(),
  uploadFile: jest.fn(),
  uploadThumbnail: jest.fn(),
  uploadVideo: jest.fn(),
} as unknown as FileStorage;

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;

  beforeEach(() => {
    mockSave.mockReset().mockResolvedValue(undefined);
    mockGetSignedURL.mockReset().mockResolvedValue(PRESIGNED_URL);
    mockSaveTag.mockReset().mockResolvedValue(undefined);
    useCase = new UploadFileUseCase(mockRepo, mockFileTagRepo, mockStorage);
  });

  it('requests a presigned URL for the filename', async () => {
    await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);

    expect(mockGetSignedURL).toHaveBeenCalledTimes(1);
    expect(mockGetSignedURL).toHaveBeenCalledWith('video.mp4');
  });

  it('sets the presigned URL on the returned file', async () => {
    const result = await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);

    expect(result.url).toBe(PRESIGNED_URL);
  });

  it('saves the file to the repository', async () => {
    await useCase.execute('image.png', 'image/png', FILE_SIZE, USER_ID);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(expect.any(File));
  });

  it('saves tags derived from the filename', async () => {
    await useCase.execute('my_photo.jpg', 'image/jpeg', FILE_SIZE, USER_ID);

    expect(mockSaveTag).toHaveBeenCalled();
  });

  it('returns the created File entity', async () => {
    const result = await useCase.execute('photo.jpg', 'image/jpeg', FILE_SIZE, USER_ID);

    expect(result).toBeInstanceOf(File);
  });

  it('creates the file with PENDING status', async () => {
    const result = await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);

    expect(result.getStatus()).toBe('PENDING');
  });

  it('stores the file size', async () => {
    const result = await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);

    expect(result.getSize()).toBe(FILE_SIZE);
  });

  it('stores the user id', async () => {
    const result = await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);

    expect(result.getUserId()).toBe(USER_ID);
  });

  it('assigns a UUID as the file id', async () => {
    const result = await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(result.getId()).toMatch(uuidRegex);
  });

  it('generates a unique id for each upload', async () => {
    const a = await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);
    const b = await useCase.execute('video.mp4', 'video/mp4', FILE_SIZE, USER_ID);

    expect(a.getId()).not.toBe(b.getId());
  });

  it('extracts extension from the filename', async () => {
    const result = await useCase.execute('clip.mp4', 'video/mp4', FILE_SIZE, USER_ID);

    expect(result.getExtension()).toBe('mp4');
  });

  it('throws when the file extension is not allowed', async () => {
    await expect(useCase.execute('document.pdf', 'application/pdf', FILE_SIZE, USER_ID)).rejects.toThrow();
  });

  it('throws when the filename has no extension', async () => {
    await expect(useCase.execute('noextension', 'application/octet-stream', FILE_SIZE, USER_ID)).rejects.toThrow();
  });
});
