import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { History } from './history.schema';

@Injectable()
export class HistoryService {
  constructor(@InjectModel(History.name) private historyModel: Model<History>) {}

  async findByUrl(url: string) {
    return this.historyModel.find({ url }).sort({ createdAt: -1 }).limit(10).lean();
  }

  async create(data: Partial<History>) {
    return new this.historyModel(data).save();
  }
}
