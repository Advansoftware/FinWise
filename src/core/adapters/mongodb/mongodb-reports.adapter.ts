// src/core/adapters/mongodb/mongodb-reports.adapter.ts

import {Db, ObjectId} from 'mongodb';
import {IReportsRepository, Report} from '@/core/ports/reports.port';

export class MongoReportsRepository implements IReportsRepository {
  constructor(private db: Db) { }

  async findByUserId(userId: string): Promise<Report[]> {
    const reports = await this.db.collection('reports')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return reports.map(this.mapToReport);
  }

  async findByUserIdAndType(userId: string, type: 'monthly' | 'annual'): Promise<Report[]> {
    const reports = await this.db.collection('reports')
      .find({ userId, type })
      .sort({ period: -1 })
      .toArray();

    return reports.map(this.mapToReport);
  }

  async findByUserIdAndPeriod(userId: string, period: string): Promise<Report | null> {
    const report = await this.db.collection('reports')
      .findOne({ userId, period });

    if (!report) return null;
    return this.mapToReport(report);
  }

  async findLatestByUserIdAndType(userId: string, type: 'monthly' | 'annual'): Promise<Report | null> {
    const report = await this.db.collection('reports')
      .findOne(
        { userId, type },
        { sort: { period: -1 } }
      );

    if (!report) return null;
    return this.mapToReport(report);
  }

  async create(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    const now = new Date();
    const doc = {
      ...reportData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.db.collection('reports').insertOne(doc);

    return {
      id: result.insertedId.toString(),
      ...doc,
    };
  }

  async update(id: string, updates: Partial<Report>): Promise<void> {
    const { id: _, createdAt, ...updateData } = updates;
    await this.db.collection('reports').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.collection('reports').deleteOne({ _id: new ObjectId(id) });
  }

  private mapToReport(doc: any): Report {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      type: doc.type,
      period: doc.period,
      data: doc.data,
      generatedAt: doc.generatedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
