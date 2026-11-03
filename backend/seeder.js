import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

import User from "./models/userModel.js";
import Withdrawal from "./models/withdrawalModel.js";
import UserTrade from "./models/userTradeModel.js";
import TradingSignal from "./models/tradingSignalModel.js"; 
import Deposit from "./models/depositModel.js"; 

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

const getFirstEnumValue = (Model, pathName, fallback) => {
  try {
    const path = Model.schema.path(pathName);
    if (path && path.enumValues && path.enumValues.length > 0) {
      return path.enumValues[0];
    }
  } catch (e) {}
  return fallback;
};

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const targetEmail = "Davebrennamanbecker@gmail.com";
    const targetPhone = "15550199888";

    // 1. CLEANUP
    console.log("Cleaning up existing data...");
    const existingUsers = await User.find({
      $or: [{ email: targetEmail }, { phoneNumber: targetPhone }],
    });

    for (const existingUser of existingUsers) {
      await UserTrade.deleteMany({ user: existingUser._id });
      await Withdrawal.deleteMany({ user: existingUser._id });
      await Deposit.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }
    console.log(`Old data removed. (${existingUsers.length} user(s) deleted)`);

    // 2. CREATE USER
    console.log("Creating user...");
    const user = await User.create({
      fullName: "Dave brennaman becker",
      email: targetEmail,
      phoneNumber: targetPhone,
      countryCode: "+1",
      password: "DBrennamanB",
      balance: 328431.71,
      totalDeposit: 100000,      
      totalWithdrawal: 187700,   
      isVerified: true,       
      isPhoneVerified: true,  
      isActive: true,
      kycStatus: "verified",  
      accountType: "individual",
      withdrawalWalletType: "BTC",
      withdrawalWalletAddress: "bc1q4mqk54peyya4p6fyhe9d62h82n3f8n6dc0xtff",
      withdrawalWalletLocked: true,
    });
    console.log(`✅ User created: ${user._id} | Email: ${user.email}`);

    // 3. GET OR CREATE DUMMY TRADING SIGNAL
    console.log("Checking for existing Trading Signal...");
    let dummySignal = await TradingSignal.findOne();
    if (!dummySignal) {
      const validSymbol = getFirstEnumValue(TradingSignal, 'symbol', 'BTCUSDT');
      dummySignal = await TradingSignal.create({
        symbol: validSymbol,
        entryPoint: 60000,
        takeProfit: 65000,
        stopLoss: 58000,
        status: "completed",
        createdBy: user._id, 
      });
    }
    const tradeSymbol = dummySignal.symbol;

    // 4. DEPOSITS ($100,000) - All dates <= Sept 15
    console.log("Creating scattered deposits...");
    const validDepositCoin = getFirstEnumValue(Deposit, 'coinType', 'BTC');

    const depositData = [
      { user: user._id, amount: 15000, coinType: validDepositCoin, walletAddress: "0x1234abcd...", network: "ERC20", status: "approved", transactionId: "TXN-SEED-001", receipt: "https://example.com/receipt1.png", createdAt: new Date("2026-09-01T10:00:00Z"), updatedAt: new Date("2026-09-01T10:00:00Z") },
      { user: user._id, amount: 20000, coinType: validDepositCoin, walletAddress: "0x1234abcd...", network: "ERC20", status: "approved", transactionId: "TXN-SEED-002", receipt: "https://example.com/receipt2.png", createdAt: new Date("2026-09-03T14:30:00Z"), updatedAt: new Date("2026-09-03T14:30:00Z") },
      { user: user._id, amount: 25000, coinType: validDepositCoin, walletAddress: "0x1234abcd...", network: "TRC20", status: "approved", transactionId: "TXN-SEED-003", receipt: "https://example.com/receipt3.png", createdAt: new Date("2026-09-05T09:15:00Z"), updatedAt: new Date("2026-09-05T09:15:00Z") },
      { user: user._id, amount: 10000, coinType: validDepositCoin, walletAddress: "0x1234abcd...", network: "BEP20", status: "approved", transactionId: "TXN-SEED-004", receipt: "https://example.com/receipt4.png", createdAt: new Date("2026-09-08T16:45:00Z"), updatedAt: new Date("2026-09-08T16:45:00Z") },
      { user: user._id, amount: 30000, coinType: validDepositCoin, walletAddress: "0x1234abcd...", network: "ERC20", status: "approved", transactionId: "TXN-SEED-005", receipt: "https://example.com/receipt5.png", createdAt: new Date("2026-09-12T11:20:00Z"), updatedAt: new Date("2026-09-12T11:20:00Z") },
    ];
    await Deposit.insertMany(depositData);

    // 5. WITHDRAWALS ($187,700) - All dates <= Sept 15
    console.log("Creating September 2026 BTC withdrawals...");
    const withdrawalData = [
      { user: user._id, amount: 50000, coinType: "BTC", walletAddress: "bc1q4mqk54peyya4p6fyhe9d62h82n3f8n6dc0xtff", network: "Bitcoin", status: "paid", createdAt: new Date("2026-09-04T10:00:00Z"), updatedAt: new Date("2026-09-04T10:00:00Z"), paidAt: new Date("2026-09-04T12:00:00Z") },
      { user: user._id, amount: 45000, coinType: "BTC", walletAddress: "bc1q4mqk54peyya4p6fyhe9d62h82n3f8n6dc0xtff", network: "Bitcoin", status: "paid", createdAt: new Date("2026-09-07T14:30:00Z"), updatedAt: new Date("2026-09-07T14:30:00Z"), paidAt: new Date("2026-09-07T15:00:00Z") },
      { user: user._id, amount: 42700, coinType: "BTC", walletAddress: "bc1q4mqk54peyya4p6fyhe9d62h82n3f8n6dc0xtff", network: "Bitcoin", status: "paid", createdAt: new Date("2026-09-10T09:15:00Z"), updatedAt: new Date("2026-09-10T09:15:00Z"), paidAt: new Date("2026-09-10T11:00:00Z") },
      { user: user._id, amount: 50000, coinType: "BTC", walletAddress: "bc1q4mqk54peyya4p6fyhe9d62h82n3f8n6dc0xtff", network: "Bitcoin", status: "paid", createdAt: new Date("2026-09-14T16:45:00Z"), updatedAt: new Date("2026-09-14T16:45:00Z"), paidAt: new Date("2026-09-14T17:00:00Z") },
    ];
    await Withdrawal.insertMany(withdrawalData);

    // 6. PROFITS ($190,560) - All dates <= Sept 15
    console.log("Creating September 2026 trade profits...");
    const profitData = [
      { user: user._id, signal: dummySignal._id, symbol: tradeSymbol, entryPoint: 26000, takeProfit: 28000, stopLoss: 25000, profitPercentage: 10, lossPercentage: 0, acceptedBalance: 400000, status: "completed", result: "profit", profit: 40123, loss: 0, completedAt: new Date("2026-09-02T10:00:00Z"), createdAt: new Date("2026-09-02T10:00:00Z"), updatedAt: new Date("2026-09-02T10:00:00Z") },
      { user: user._id, signal: dummySignal._id, symbol: tradeSymbol, entryPoint: 1600, takeProfit: 1800, stopLoss: 1500, profitPercentage: 10, lossPercentage: 0, acceptedBalance: 350000, status: "completed", result: "profit", profit: 34987, loss: 0, completedAt: new Date("2026-09-06T14:00:00Z"), createdAt: new Date("2026-09-06T14:00:00Z"), updatedAt: new Date("2026-09-06T14:00:00Z") },
      { user: user._id, signal: dummySignal._id, symbol: tradeSymbol, entryPoint: 20, takeProfit: 25, stopLoss: 18, profitPercentage: 10, lossPercentage: 0, acceptedBalance: 450000, status: "completed", result: "profit", profit: 45123, loss: 0, completedAt: new Date("2026-09-09T11:30:00Z"), createdAt: new Date("2026-09-09T11:30:00Z"), updatedAt: new Date("2026-09-09T11:30:00Z") },
      { user: user._id, signal: dummySignal._id, symbol: tradeSymbol, entryPoint: 0.5, takeProfit: 0.6, stopLoss: 0.45, profitPercentage: 8, lossPercentage: 0, acceptedBalance: 444500, status: "completed", result: "profit", profit: 35456, loss: 0, completedAt: new Date("2026-09-11T09:00:00Z"), createdAt: new Date("2026-09-11T09:00:00Z"), updatedAt: new Date("2026-09-11T09:00:00Z") },
      { user: user._id, signal: dummySignal._id, symbol: tradeSymbol, entryPoint: 0.25, takeProfit: 0.3, stopLoss: 0.22, profitPercentage: 10, lossPercentage: 0, acceptedBalance: 350000, status: "completed", result: "profit", profit: 34871, loss: 0, completedAt: new Date("2026-09-15T08:00:00Z"), createdAt: new Date("2026-09-15T08:00:00Z"), updatedAt: new Date("2026-09-15T08:00:00Z") },
    ];
    await UserTrade.insertMany(profitData);

    // 7. LOSSES ($2,860) - All dates <= Sept 15
    console.log("Creating September 2026 trade losses...");
    const lossData = [
      { user: user._id, signal: dummySignal._id, symbol: tradeSymbol, entryPoint: 0.08, takeProfit: 0.1, stopLoss: 0.07, profitPercentage: 0, lossPercentage: 5, acceptedBalance: 30000, status: "completed", result: "loss", profit: 0, loss: 1476, completedAt: new Date("2026-09-03T12:00:00Z"), createdAt: new Date("2026-09-03T12:00:00Z"), updatedAt: new Date("2026-09-03T12:00:00Z") },
      { user: user._id, signal: dummySignal._id, symbol: tradeSymbol, entryPoint: 0.9, takeProfit: 1.0, stopLoss: 0.8, profitPercentage: 0, lossPercentage: 4, acceptedBalance: 34000, status: "completed", result: "loss", profit: 0, loss: 1384, completedAt: new Date("2026-09-13T10:00:00Z"), createdAt: new Date("2026-09-13T10:00:00Z"), updatedAt: new Date("2026-09-13T10:00:00Z") },
    ];
    await UserTrade.insertMany(lossData);

    // 8. SKIP ACTIVE TRADES
    console.log("✅ Skipping active trade (Open Positions = 0)");

    console.log("🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();