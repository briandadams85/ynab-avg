import axios from 'axios';
import { YNAB_CONFIG } from '../config/ynab';

const ynabApi = axios.create({
  baseURL: YNAB_CONFIG.API_URL,
  headers: {
    'Authorization': `Bearer ${YNAB_CONFIG.API_KEY}`
  }
});

export const getBudgets = async () => {
  try {
    const response = await ynabApi.get('/budgets');
    return response.data.data.budgets;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
};

export const getTransactions = async (startDate, endDate, budgetId) => {
  try {
    const response = await ynabApi.get(`/budgets/${budgetId}/transactions`, {
      params: {
        since_date: startDate,
        until_date: endDate
      }
    });
    return response.data.data.transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getCategories = async (budgetId) => {
  try {
    const response = await ynabApi.get(`/budgets/${budgetId}/categories`);
    return response.data.data.category_groups;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}; 