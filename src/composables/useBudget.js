import { ref, watch } from 'vue';
import { getBudgets } from '../services/ynabService';

export function useBudget() {
  const budgets = ref([]);
  const selectedBudgetId = ref(localStorage.getItem('selectedBudgetId') || '');
  const loading = ref(false);
  const error = ref(null);

  const fetchBudgets = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await getBudgets();
      budgets.value = data;
      // If no budget is selected and we have budgets, select the first one
      if (!selectedBudgetId.value && data.length > 0) {
        selectedBudgetId.value = data[0].id;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  watch(selectedBudgetId, (newValue) => {
    localStorage.setItem('selectedBudgetId', newValue);
  });

  return {
    budgets,
    selectedBudgetId,
    loading,
    error,
    fetchBudgets
  };
} 