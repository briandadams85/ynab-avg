import { ref, computed } from 'vue';
import { getTransactions, getCategories } from '../services/ynabService';

export function useSpendingAnalysis(selectedBudgetId) {
  const transactions = ref([]);
  const previousYearTransactions = ref([]);
  const categories = ref([]);
  const selectedYear = ref(new Date().getFullYear());
  const loading = ref(false);
  const error = ref(null);

  const fetchData = async () => {
    if (!selectedBudgetId.value) return;
    
    loading.value = true;
    error.value = null;
    try {
      const startDate = `${selectedYear.value}-01-01`;
      const endDate = `${selectedYear.value}-12-31`;
      const prevYearStartDate = `${selectedYear.value - 1}-01-01`;
      const prevYearEndDate = `${selectedYear.value - 1}-12-31`;
      
      const [transactionsData, prevYearTransactionsData, categoriesData] = await Promise.all([
        getTransactions(startDate, endDate, selectedBudgetId.value),
        getTransactions(prevYearStartDate, prevYearEndDate, selectedBudgetId.value),
        getCategories(selectedBudgetId.value)
      ]);

      transactions.value = transactionsData;
      previousYearTransactions.value = prevYearTransactionsData;
      categories.value = categoriesData;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const isSpendingCategory = (categoryId) => {
    for (const group of categories.value) {
      const category = group.categories.find(c => c.id === categoryId);
      if (category) {
        // Exclude hidden, deleted, and internal categories
        return !category.hidden && 
               !category.deleted && 
               group.name !== 'Internal Master Category' &&
               group.name !== 'Credit Card Payments';
      }
    }
    return false;
  };

  const calculateMonthlyAverages = (transactionsList, year) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const monthsToAverage = year === currentYear ? currentMonth : 12;

    const categoryTotals = {};
    const categoryCounts = {};
    const groupTotals = {};
    const groupCounts = {};

    transactionsList.forEach(transaction => {
      if (transaction.amount < 0) { // Only count expenses
        // Handle split transactions
        if (transaction.subtransactions && transaction.subtransactions.length > 0) {
          transaction.subtransactions.forEach(subtransaction => {
            if (subtransaction.amount < 0 && isSpendingCategory(subtransaction.category_id)) {
              const categoryId = subtransaction.category_id;
              const groupId = getCategoryGroupId(categoryId);
              
              if (!categoryTotals[categoryId]) {
                categoryTotals[categoryId] = 0;
                categoryCounts[categoryId] = 0;
              }
              categoryTotals[categoryId] += Math.abs(subtransaction.amount);
              categoryCounts[categoryId] += 1;

              if (groupId) {
                if (!groupTotals[groupId]) {
                  groupTotals[groupId] = 0;
                  groupCounts[groupId] = 0;
                }
                groupTotals[groupId] += Math.abs(subtransaction.amount);
                groupCounts[groupId] += 1;
              }
            }
          });
        } else {
          // Handle regular transactions
          const categoryId = transaction.category_id;
          if (isSpendingCategory(categoryId)) {
            const groupId = getCategoryGroupId(categoryId);
            
            if (!categoryTotals[categoryId]) {
              categoryTotals[categoryId] = 0;
              categoryCounts[categoryId] = 0;
            }
            categoryTotals[categoryId] += Math.abs(transaction.amount);
            categoryCounts[categoryId] += 1;

            if (groupId) {
              if (!groupTotals[groupId]) {
                groupTotals[groupId] = 0;
                groupCounts[groupId] = 0;
              }
              groupTotals[groupId] += Math.abs(transaction.amount);
              groupCounts[groupId] += 1;
            }
          }
        }
      }
    });

    const categoryAverages = {};
    const categoryTotalsObj = {};
    const groupAverages = {};
    const groupTotalsObj = {};

    Object.keys(categoryTotals).forEach(categoryId => {
      categoryTotalsObj[categoryId] = categoryTotals[categoryId];
      const average = categoryTotals[categoryId] / monthsToAverage;
      categoryAverages[categoryId] = average;
      // Store the average in localStorage
      localStorage.setItem(`average_${categoryId}_${year}`, average.toString());
    });

    Object.keys(groupTotals).forEach(groupId => {
      groupTotalsObj[groupId] = groupTotals[groupId];
      const average = groupTotals[groupId] / monthsToAverage;
      groupAverages[groupId] = average;
      // Store the average in localStorage
      localStorage.setItem(`average_${groupId}_${year}`, average.toString());
    });

    return { 
      categoryAverages, 
      categoryTotals: categoryTotalsObj,
      groupAverages,
      groupTotals: groupTotalsObj
    };
  };

  const getCategoryGroupId = (categoryId) => {
    for (const group of categories.value) {
      const category = group.categories.find(c => c.id === categoryId);
      if (category) {
        return group.id;
      }
    }
    return null;
  };

  const getCategoryGroupName = (groupId) => {
    const group = categories.value.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  const monthlyAverages = computed(() => {
    return calculateMonthlyAverages(transactions.value, selectedYear.value).categoryAverages;
  });

  const monthlyGroupAverages = computed(() => {
    return calculateMonthlyAverages(transactions.value, selectedYear.value).groupAverages;
  });

  const currentYearTotals = computed(() => {
    return calculateMonthlyAverages(transactions.value, selectedYear.value).categoryTotals;
  });

  const currentYearGroupTotals = computed(() => {
    return calculateMonthlyAverages(transactions.value, selectedYear.value).groupTotals;
  });

  const previousYearAverages = computed(() => {
    return calculateMonthlyAverages(previousYearTransactions.value, selectedYear.value - 1).categoryAverages;
  });

  const previousYearGroupAverages = computed(() => {
    return calculateMonthlyAverages(previousYearTransactions.value, selectedYear.value - 1).groupAverages;
  });

  const previousYearTotals = computed(() => {
    return calculateMonthlyAverages(previousYearTransactions.value, selectedYear.value - 1).categoryTotals;
  });

  const previousYearGroupTotals = computed(() => {
    return calculateMonthlyAverages(previousYearTransactions.value, selectedYear.value - 1).groupTotals;
  });

  const yearOverYearChanges = computed(() => {
    const changes = {};
    const currentAverages = monthlyAverages.value;
    const previousAverages = previousYearAverages.value;
    const currentTotals = currentYearTotals.value;
    const previousTotals = previousYearTotals.value;

    Object.keys(currentAverages).forEach(categoryId => {
      const current = currentAverages[categoryId];
      const previous = previousAverages[categoryId] || 0;
      const currentTotal = currentTotals[categoryId];
      const previousTotal = previousTotals[categoryId] || 0;
      const difference = current - previous;
      const percentage = previous ? (difference / previous) * 100 : 0;

      changes[categoryId] = {
        amount: difference,
        percentage,
        currentTotal,
        previousTotal
      };
    });

    return changes;
  });

  const yearOverYearGroupChanges = computed(() => {
    const changes = {};
    const currentAverages = monthlyGroupAverages.value;
    const previousAverages = previousYearGroupAverages.value;
    const currentTotals = currentYearGroupTotals.value;
    const previousTotals = previousYearGroupTotals.value;

    Object.keys(currentAverages).forEach(groupId => {
      const current = currentAverages[groupId];
      const previous = previousAverages[groupId] || 0;
      const currentTotal = currentTotals[groupId];
      const previousTotal = previousTotals[groupId] || 0;
      const difference = current - previous;
      const percentage = previous ? (difference / previous) * 100 : 0;

      changes[groupId] = {
        amount: difference,
        percentage,
        currentTotal,
        previousTotal
      };
    });

    return changes;
  });

  const categoryNames = computed(() => {
    const names = {};
    categories.value.forEach(group => {
      group.categories.forEach(category => {
        names[category.id] = category.name;
      });
    });
    return names;
  });

  const groupNames = computed(() => {
    const names = {};
    categories.value.forEach(group => {
      names[group.id] = group.name;
    });
    return names;
  });

  return {
    transactions,
    previousYearTransactions,
    categories,
    selectedYear,
    loading,
    error,
    fetchData,
    monthlyAverages,
    monthlyGroupAverages,
    previousYearAverages,
    previousYearGroupAverages,
    yearOverYearChanges,
    yearOverYearGroupChanges,
    categoryNames,
    groupNames,
    currentYearTotals,
    currentYearGroupTotals,
    previousYearTotals,
    previousYearGroupTotals,
    getCategoryGroupName
  };
} 