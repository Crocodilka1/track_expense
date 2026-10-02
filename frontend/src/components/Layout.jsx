import Sidebar from './Sidebar.jsx';
import { useEffect, useMemo, useState } from 'react';
import { styles } from '../assets/dummyStyles.js';
import Navbar from './Navbar.jsx';
import axios from 'axios';
import { Activity, ArrowDown, ArrowUp, Car, CreditCard, Gift, Home, PiggyBank, RussianRuble, ShoppingCart, TrendingUp, Utensils, Zap } from 'lucide-react';

const API_URL = 'http://localhost:4000/api';
const CATEGORY_ICONS = {
  Food: <Utensils className='w-4 h-4' />,
  Housing: <Home className='w-4 h-4' />,
  Transport: <Car className='w-4 h-4' />,
  Shopping: <ShoppingCart className='w-4 h-4' />,
  Entertainment: <Gift className='w-4 h-4' />,
  Utilities: <Zap className='w-4 h-4' />,
  Healthcare: <Activity className='w-4 h-4' />,
  Salary: <ArrowUp className='w-4 h-4' />,
  Freelance: <CreditCard className='w-4 h-4' />,
  Savings: <PiggyBank className='w-4 h-4' />,
}

const filterTransitions = (transactions, frame) => {
  const now = new Date();
  const today = new Date(now).setHours(0, 0, 0, 0);

  switch (frame) {
    case 'daily':
      return transactions.filter((t) => new Date(t.date) >= today);
    case 'weekly': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return transactions.filter((t) => new Date(t.date) >= startOfWeek)
    }
    case 'monthly':
      return transactions.filter(
        (t) => new Date(t.date).getMonth() === now.getMonth()
      );
    default:
      return transactions;
  }
};

const safeArrayFromResponse = (res) => {
  const body = res?.data;
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.incomes)) return body.incomes;
  if (Array.isArray(body.expenses)) return body.expenses;
  return [];
}

const Layout = ({ onLogout, user }) => {
  const [transactions, setTransactions] = useState([]);
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [incomeRes, expenseRes] = await Promise.all([
        axios.get(`${API_URL}/income/get`, { headers }),
        axios.get(`${API_URL}/expense/get`, { headers }),
      ]);

      const incomes = safeArrayFromResponse(incomeRes).map((i) => ({
        ...i,
        type: 'income',
      }));
      const expenses = safeArrayFromResponse(expenseRes).map((e) => ({
        ...e,
        type: 'expense',
      }));

      const allTransactions = [...incomes, ...expenses]
        .map((t) => ({
          id: t._id || t.id || t.id_str || Math.random().toString(36).slice(2),
          description: t.description || t.title || t.note || "",
          amount: t.amount != null ? Number(t.amount) : Number(t.value) || 0,
          date: t.date || t.createdAt || new Date().toISOString(),
          category: t.category || t.type || "Other",
          type: t.type,
          raw: t,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(allTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "Failed to fetch transactions",
        err?.response || err.message || err
      );
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint =
        transaction.type === 'income' ? 'income/add' : 'expense/add';
      await axios.post(`${API_URL}/${endpoint}`, transaction, { headers });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to add transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  }

  const editTransaction = async (id, transaction) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint =
        transaction.type === 'income' ? 'income/update' : 'expense/update';
      await axios.put(`${API_URL}/${endpoint}/${id}`, transaction, { headers });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to edit transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  };

  const deleteTransaction = async (id, type) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint = type === 'income' ? 'income/delete' : 'expense/delete';
      await axios.delete(`${API_URL}/${endpoint}/${id}`, { headers });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to delete transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(
    () => filterTransitions(transactions, timeFrame),
    [transactions, timeFrame]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const last300DaysTransactions = transactions.filter(
      (t) => new Date(t.date) >= thirtyDaysAgo
    );

    const last300DaysIncome = last300DaysTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const last300DaysExpenses = last300DaysTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate =
      last300DaysIncome > 0
        ? Math.round(
          ((last300DaysIncome - last300DaysExpenses) / last300DaysIncome) * 100
        )
        : 0;

    const last600DaysAgo = new Date(now);
    last600DaysAgo.setDate(now.getDate() - 60);

    const previous300DaysTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= last600DaysAgo && date < thirtyDaysAgo;
    });

    const previous300DaysExpenses = previous300DaysTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseChange =
      previous300DaysExpenses > 0
        ? Math.round(
          ((last300DaysExpenses - previous300DaysExpenses) /
            previous300DaysExpenses) *
          100
        )
        : 0;

    return {
      totalTransactions: transactions.length,
      last300DaysIncome,
      last300DaysExpenses,
      last300daysSavings: last300DaysIncome - last300DaysExpenses,
      allTimeIncome,
      allTimeExpenses,
      allTimeSavings: allTimeIncome - allTimeExpenses,
      last300DaysCount: last300DaysTransactions.length,
      savingsRate,
      expenseChange,
    }
  }, [transactions]);

  const timeFrameLabel = useMemo(
    () =>
      timeFrame === 'daily'
        ? "Today"
        : timeFrame === 'weekly'
          ? 'This Week'
          : 'This Month',
    [timeFrame]
  );

  const outletContext = {
    transactions: filterTransitions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
    timeFrame,
    setTimeFrame,
    lastUpdated,
  };

  const getSavingsRating = (rate) =>
    rate > 30 ? "Excellent" : rate > 20 ? "Good" : "Needs improvement";

  const topCategories = useMemo(
    () =>
      Object.entries(
        transactions
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
          }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [transactions]
  );

  const displayedTransactions = showAllTransactions
    ? transactions
    : transactions.slice(0, 4);

  return (
    <div className={styles.layout.root}>
      <Navbar user={user} onLogout={onLogout} />
      <Sidebar user={user} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      <div className={styles.layout.mainContainer(sidebarCollapsed)}>
        <div className={styles.header.container}>
          <div>
            <h1 className={styles.header.title}>
              Dashboard
            </h1>
            <p className={styles.header.subtitle}>
              Welcome Back
            </p>
          </div>
        </div>
        <div className={styles.statCards.grid}>
          <div className={styles.statCards.card}>
            <div className={styles.statCards.cardHeader}>
              <div>
                <p className={styles.statCards.cardTitle}>
                  Total Balance
                </p>
                <p className={styles.statCards.cardValue}>
                  P
                  {stats.allTimeSavings.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className={styles.statCards.iconContainer('teal')}>
                <RussianRuble className={styles.statCards.icon('teal')} />
              </div>
            </div>
            <p className={styles.statCards.cardFooter}>
              <span className=' text-teal-600 font-medium'>
                +P{stats.last300daysSavings.toLocaleString()}
              </span>{" "}
              this month
            </p>
          </div>

          <div className={styles.statCards.card}>
            <div className={styles.statCards.cardHeader}>
              <div>
                <p className={styles.statCards.cardTitle}>
                  Monthly Income
                </p>
                <p className={styles.statCards.cardValue}>
                  P
                  {stats.last300DaysIncome.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className={styles.statCards.iconContainer('green')}>
                <ArrowUp className={styles.statCards.icon('teal')} />
              </div>
            </div>
            <p className={styles.statCards.cardFooter}>
              <span className=' text-green-600 font-medium'>
                +12.5%
              </span> from last month
            </p>
          </div>

          <div className={styles.statCards.card}>
            <div className={styles.statCards.cardHeader}>
              <div>
                <p className={styles.statCards.cardTitle}>
                  Monthly Expense
                </p>
                <p className={styles.statCards.cardValue}>
                  P
                  {stats.last300DaysExpenses.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className={styles.statCards.iconContainer('orange')}>
                <ArrowDown className={styles.statCards.icon('orange')} />
              </div>
            </div>
            <p className={styles.statCards.cardFooter}>
              <span className={`${styles.colors.expenseChange(stats.expenseChange)} font-medium`}>
                {stats.expenseChange > 0 ? "+" : ""}
                {stats.expenseChange}%
              </span>{" "}
              from last month
            </p>
          </div>

          <div className={styles.statCards.card}>
            <div className={styles.statCards.cardHeader}>
              <div>
                <p className={styles.statCards.cardTitle}>
                  Saving Rate
                </p>
                <p className={styles.statCards.cardValue}>
                  {stats.savingsRate}%
                </p>
              </div>
              <div className={styles.statCards.iconContainer('blue')}>
                <PiggyBank className={styles.statCards.icon('blue')} />
              </div>
            </div>
            <p className={styles.statCards.cardFooter}>
              {getSavingsRating(stats.savingsRate)}
            </p>
          </div>
        </div>
        <div className={styles.grid.main}>
          <div className={styles.grid.leftColumn}>
            <div className={styles.cards.base}>
              <div className={styles.cards.header}>
                <h3 className={styles.cards.title}>
                  <TrendingUp className=' w-6 h-6 text-teal-500' />
                  Financial Overview
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout