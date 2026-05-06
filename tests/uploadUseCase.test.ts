import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Readable } from 'stream';

import { UploadFileUseCase } from '#application/use-case/UploadFileUseCase.js';
import { File } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileStorage } from '#domain/repositories/fileStorage.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';

const mockSave = jest.fn<FileRepository['save']>().mockResolvedValue(undefined);
const mockUploadFile = jest.fn<FileStorage['uploadFile']>().mockResolvedValue('bucket/uploads/test.mp4');
const mockSaveTag = jest.fn<FileTagRepository['saveTag']>().mockResolvedValue(undefined);

const mockRepo = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findByObjectKey: jest.fn(),
  getFiles: jest.fn(),
  save: mockSave,
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
  getThumbnailsBucket: jest.fn(),
  getVideosBucket: jest.fn(),
  upload: jest.fn(),
  uploadFile: mockUploadFile,
  uploadThumbnail: jest.fn(),
} as unknown as FileStorage;

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;

  beforeEach(() => {
    mockSave.mockReset().mockResolvedValue(undefined);
    mockUploadFile.mockReset().mockResolvedValue('bucket/uploads/test.mp4');
    mockSaveTag.mockReset().mockResolvedValue(undefined);
    useCase = new UploadFileUseCase(mockRepo, mockFileTagRepo, mockStorage);
  });

  it('uploads the file to storage with correct args', async () => {
    await useCase.execute('video.mp4', 'video/mp4', Buffer.from('video-data'));

    expect(mockUploadFile).toHaveBeenCalledTimes(1);
    const [name, passedStream, mime] = mockUploadFile.mock.calls[0];
    expect(name).toBe('video.mp4');
    expect(passedStream).toBeInstanceOf(Readable);
    expect(mime).toBe('video/mp4');
  });

  it('saves the file to the repository', async () => {
    await useCase.execute('image.png', 'image/png', Buffer.from('data'));

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(expect.any(File));
  });

  it('saves tags derived from the filename', async () => {
    await useCase.execute('my_photo.jpg', 'image/jpeg', Buffer.from('data'));

    expect(mockSaveTag).toHaveBeenCalled();
  });

  it('returns the created File entity', async () => {
    const result = await useCase.execute('photo.jpg', 'image/jpeg', Buffer.from('data'));

    expect(result).toBeInstanceOf(File);
  });

  it('creates the file with PENDING status', async () => {
    const result = await useCase.execute('video.mp4', 'video/mp4', Buffer.from('data'));

    expect(result.getStatus()).toBe('PENDING');
  });

  it('assigns a UUID as the file id', async () => {
    const result = await useCase.execute('video.mp4', 'video/mp4', Buffer.from('data'));
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    expect(result.getId()).toMatch(uuidRegex);
  });

  it('generates a unique id for each upload', async () => {
    const buffer = Buffer.from('data');
    const a = await useCase.execute('video.mp4', 'video/mp4', buffer);
    const b = await useCase.execute('video.mp4', 'video/mp4', buffer);

    expect(a.getId()).not.toBe(b.getId());
  });

  it('extracts extension from the filename', async () => {
    const result = await useCase.execute('clip.mp4', 'video/mp4', Buffer.from('data'));

    expect(result.getExtension()).toBe('mp4');
  });

  it('throws when the file extension is not allowed', async () => {
    await expect(useCase.execute('document.pdf', 'application/pdf', Buffer.from('data'))).rejects.toThrow();
  });

  it('throws when the filename has no extension', async () => {
    await expect(useCase.execute('noextension', 'application/octet-stream', Buffer.from('data'))).rejects.toThrow();
  });
});
