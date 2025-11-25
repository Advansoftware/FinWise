// src/core/adapters/mongodb/mongodb-payment.adapter.ts

import { IPaymentRepository, SubscriptionData } from '@/core/ports/payment.port';
import { UserPlan } from '@/lib/types';
import { Db, ObjectId } from 'mongodb';

export class MongoPaymentRepository implements IPaymentRepository {
  constructor(private db: Db) { }

  async updateUserSubscription(userId: string, subscriptionData: Partial<SubscriptionData>): Promise<void> {
    const usersCollection = this.db.collection('users');
    const userObjectId = new ObjectId(userId);

    const updates: any = {};

    if (subscriptionData.subscriptionId !== undefined) {
      updates.stripeSubscriptionId = subscriptionData.subscriptionId || null;
    }

    if (subscriptionData.customerId !== undefined) {
      updates.stripeCustomerId = subscriptionData.customerId;
    }

    if (subscriptionData.plan !== undefined) {
      updates.plan = subscriptionData.plan;
    }

    if (subscriptionData.currentPeriodEnd !== undefined) {
      updates.stripeCurrentPeriodEnd = subscriptionData.currentPeriodEnd || null;
    }

    if (subscriptionData.status !== undefined) {
      updates.subscriptionStatus = subscriptionData.status;
    }

    if (subscriptionData.cancelAtPeriodEnd !== undefined) {
      updates.cancelAtPeriodEnd = subscriptionData.cancelAtPeriodEnd;
    }

    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: updates }
    );
  }

  async getUserByStripeCustomerId(customerId: string): Promise<{ uid: string; stripeCustomerId: string } | null> {
    const usersCollection = this.db.collection('users');
    const user = await usersCollection.findOne(
      { stripeCustomerId: customerId },
      { projection: { _id: 1, stripeCustomerId: 1 } }
    );

    return user ? {
      uid: user._id.toString(),
      stripeCustomerId: user.stripeCustomerId
    } : null;
  }

  async getUserByUserId(userId: string): Promise<{ uid: string; stripeCustomerId?: string } | null> {
    const usersCollection = this.db.collection('users');
    const userObjectId = new ObjectId(userId);
    const user = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { _id: 1, stripeCustomerId: 1 } }
    );

    return user ? {
      uid: user._id.toString(),
      stripeCustomerId: user.stripeCustomerId
    } : null;
  }

  async updateUserPlan(userId: string, plan: UserPlan, credits: number): Promise<void> {
    const usersCollection = this.db.collection('users');
    const userObjectId = new ObjectId(userId);

    await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $set: {
          plan: plan,
          aiCredits: credits,
          updatedAt: new Date()
        }
      }
    );
  }

  async addUserCredits(userId: string, credits: number): Promise<void> {
    const usersCollection = this.db.collection('users');
    const userObjectId = new ObjectId(userId);

    await usersCollection.updateOne(
      { _id: userObjectId },
      {
        $inc: { aiCredits: credits },
        $set: { updatedAt: new Date() }
      }
    );
  }
}
