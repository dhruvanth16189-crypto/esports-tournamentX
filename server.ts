import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './src/lib/db.ts';
import { User } from './src/models/User.ts';
import { Tournament } from './src/models/Tournament.ts';
import { Transaction } from './src/models/Transaction.ts';
import { PaymentSettings } from './src/models/PaymentSettings.ts';
import { generateUPIDeepLink } from './src/services/upiService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Connect to MongoDB
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to connect to database on startup');
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Free Fire Tournament API is running' });
  });

  // Payment Settings (UPI ID)
  app.get('/api/payment-settings', async (req, res) => {
    try {
      let settings = await PaymentSettings.findOne();
      if (!settings) {
        settings = await PaymentSettings.create({ upiId: 'admin@ybl' }); // Default
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/admin/payment-settings', async (req, res) => {
    try {
      const { email, upiId } = req.body;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });
      
      let settings = await PaymentSettings.findOne();
      if (!settings) {
        settings = await PaymentSettings.create({ upiId });
      } else {
        settings.upiId = upiId;
        await settings.save();
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // UPI Link Generation
  app.get('/api/upi-link', async (req, res) => {
    try {
      const amount = Number(req.query.amount) || 0;
      const settings = await PaymentSettings.findOne();
      const payeeVPA = settings ? settings.upiId : 'admin@ybl';
      const link = generateUPIDeepLink(payeeVPA, amount);
      res.json({ link, vpa: payeeVPA });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Deposit Transaction Endpoint
  app.post('/api/transactions/deposit', async (req, res) => {
    try {
      const { email, amount, txnID } = req.body;
      
      let user = await User.findOne({ email });
      // If user doesn't exist for test purposes, create one
      if (!user) {
        user = await User.create({
          name: email.split('@')[0],
          email,
          googleId: `google-${Date.now()}`
        });
      }

      const transaction = await Transaction.create({
        userId: user._id,
        type: 'deposit',
        amount: Number(amount),
        txnID: txnID || `dep-${Date.now()}`,
        status: 'pending'
      });

      res.json(transaction);
    } catch (err: any) {
      console.error('Deposit error:', err);
      if (err.code === 11000) {
        return res.status(400).json({ error: 'Transaction ID already exists' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin Routes
  app.post('/api/tournaments/create', async (req, res) => {
    try {
      const { email, matchMode, subMode, entryFee, prizePool, startTime } = req.body;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });
      
      const tournament = await Tournament.create({
        matchMode, subMode, entryFee, prizePool, startTime
      });
      res.json(tournament);
    } catch (err) {
      console.error('Create tournament error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/admin/tournaments', async (req, res) => {
    try {
      const email = req.query.email as string;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });

      const tournaments = await Tournament.find().populate('registeredUsers').sort({ createdAt: -1 });
      res.json(tournaments);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/admin/tournaments/:id/winner', async (req, res) => {
    try {
      const { email, winnerId } = req.body;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });

      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
      
      if (tournament.matchStatus === 'completed') return res.status(400).json({ error: 'Tournament already completed' });

      const winner = await User.findById(winnerId);
      if (!winner) return res.status(404).json({ error: 'Winner not found' });

      // Update winner balance
      winner.virtualBalance += tournament.prizePool;
      await winner.save();

      // Create transaction record
      await Transaction.create({
        userId: winner._id,
        type: 'deposit',
        amount: tournament.prizePool,
        status: 'approved',
        txnID: `WIN-${tournament._id}-${Date.now()}`
      });

      // Update tournament
      tournament.matchStatus = 'completed';
      await tournament.save();

      res.json({ message: 'Winner declared successfully' });
    } catch (err) {
      console.error('Declare winner error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Server Time Endpoint
  app.get('/api/server-time', (req, res) => {
    res.json({ serverTime: new Date().getTime() });
  });

  // Admin Force Start Tournament
  app.post('/api/admin/tournaments/:id/force-start', async (req, res) => {
    try {
      const { email } = req.body;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });

      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
      
      tournament.matchStatus = 'ongoing';
      await tournament.save();
      res.json({ message: 'Tournament force started' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin Force End Tournament
  app.post('/api/admin/tournaments/:id/force-end', async (req, res) => {
    try {
      const { email } = req.body;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });

      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
      
      tournament.matchStatus = 'completed';
      await tournament.save();
      res.json({ message: 'Tournament force ended' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Public Tournaments Endpoint
  app.get('/api/tournaments', async (req, res) => {
    try {
      const tournaments = await Tournament.find().sort({ startTime: 1 });
      res.json(tournaments);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // User Join Tournament
  app.post('/api/tournaments/:id/join', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const tournament = await Tournament.findById(req.params.id);
      if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

      if (tournament.matchStatus !== 'scheduled') {
        return res.status(400).json({ error: 'Tournament is not open for registration' });
      }

      if (new Date(tournament.startTime).getTime() < new Date().getTime()) {
        return res.status(400).json({ error: 'Tournament has already started' });
      }

      if (tournament.registeredUsers.includes(user._id)) {
        return res.status(400).json({ error: 'Already registered' });
      }

      if (user.virtualBalance < tournament.entryFee) {
        return res.status(400).json({ error: 'Insufficient virtual balance' });
      }

      user.virtualBalance -= tournament.entryFee;
      await user.save();

      tournament.registeredUsers.push(user._id);
      await tournament.save();

      res.json({ message: 'Successfully joined tournament' });
    } catch (err) {
      console.error('Join error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin Transactions Endpoint
  app.get('/api/admin/transactions', async (req, res) => {
    try {
      const email = req.query.email as string;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });

      const transactions = await Transaction.find({ status: 'pending' }).populate('userId', 'name email').sort({ createdAt: -1 });
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin Approve Transaction
  app.post('/api/admin/transactions/:id/approve', async (req, res) => {
    try {
      const { email } = req.body;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });

      const transaction = await Transaction.findById(req.params.id);
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      if (transaction.status !== 'pending') return res.status(400).json({ error: 'Transaction not pending' });

      transaction.status = 'approved';
      await transaction.save();

      if (transaction.type === 'deposit') {
        const user = await User.findById(transaction.userId);
        if (user) {
          user.virtualBalance += transaction.amount;
          await user.save();
        }
      }

      res.json({ message: 'Transaction approved' });
    } catch (err) {
      console.error('Approve error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Admin Deny Transaction
  app.post('/api/admin/transactions/:id/deny', async (req, res) => {
    try {
      const { email } = req.body;
      if (email !== 'dhruvanth16189@gmail.com') return res.status(403).json({ error: 'Unauthorized' });

      const transaction = await Transaction.findById(req.params.id);
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
      if (transaction.status !== 'pending') return res.status(400).json({ error: 'Transaction not pending' });

      transaction.status = 'denied';
      await transaction.save();

      if (transaction.type === 'withdraw') {
        const user = await User.findById(transaction.userId);
        if (user) {
          user.virtualBalance += transaction.amount;
          await user.save();
        }
      }

      res.json({ message: 'Transaction denied' });
    } catch (err) {
      console.error('Deny error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Firebase Config Endpoint
  app.get('/api/firebase-config', async (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      const data = await fs.promises.readFile(configPath, 'utf8');
      res.json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ error: 'Failed to load Firebase config' });
    }
  });

  // Auth login endpoint
  app.post('/api/transactions/withdraw', async (req, res) => {
    try {
      const { email, amount } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      if (user.virtualBalance < Number(amount)) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      user.virtualBalance -= Number(amount);
      await user.save();
      
      const transaction = await Transaction.create({
        userId: user._id,
        type: 'withdraw',
        amount: Number(amount),
        status: 'pending'
      });
      
      res.json(transaction);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, displayName, uid } = req.body;
      let user = await User.findOne({ email });
      
      const isAdmin = email === 'dhruvanth16189@gmail.com';

      if (!user) {
        user = await User.create({
          name: displayName || email.split('@')[0],
          email,
          googleId: uid
        });
      }

      res.json({ virtualBalance: user.virtualBalance, username: user.name, isAdmin: isAdmin });
    } catch (err) {
      console.error('Auth login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // User Profile endpoint
  app.get('/api/user/profile', async (req, res) => {
    try {
      const email = req.query.email as string;
      let user = await User.findOne({ email });
      if (!user && email) {
        // Create dummy user for test purposes if not exists
        user = await User.create({
          name: typeof email === 'string' ? email.split('@')[0] : 'User',
          email,
          googleId: `google-${Date.now()}`
        });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/api/user/transactions', async (req, res) => {
    try {
      const email = req.query.email as string;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const transactions = await Transaction.find({ userId: user._id }).sort({ createdAt: -1 });
      res.json(transactions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
