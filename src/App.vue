<template>
  <BNavbar fixed="top" variant="dark" class="mb-3">
    <div class="container">
      <BNavbarBrand class="fw-bold">YNAB Monthly Spending Averages</BNavbarBrand>
    </div>
  </BNavbar>

  <div class="container py-2" style="margin-top: 56px;">
    <div class="mb-3">
      <div class="row g-2 mb-2">
        <div class="col-md-4">
          <BFormGroup label="Budget" label-for="budget-select">
            <BFormSelect
              id="budget-select"
              v-model="selectedBudgetId"
              @change="fetchData"
              :options="budgetOptions"
              class="mb-2 mb-md-0"
            ></BFormSelect>
          </BFormGroup>
        </div>
        <div class="col-md-4">
          <BFormGroup label="Year" label-for="year-select">
            <BFormSelect
              id="year-select"
              v-model="selectedYear"
              @change="fetchData"
              :options="availableYears"
              class="mb-2 mb-md-0"
            ></BFormSelect>
          </BFormGroup>
        </div>
        <div class="col-md-4">
          <BFormGroup label="View by" label-for="view-by-select">
            <BFormSelect
              id="view-by-select"
              v-model="viewByGroup"
              :options="[
                { text: 'Category', value: false },
                { text: 'Category Group', value: true }
              ]"
              class="mb-2 mb-md-0"
            ></BFormSelect>
          </BFormGroup>
        </div>
      </div>
    </div>

    <div v-if="loading || budgetLoading" class="text-center py-2">
      <BSpinner variant="primary" />
    </div>

    <div v-else-if="error || budgetError" class="alert alert-danger">
      {{ error || budgetError }}
    </div>

    <div v-else>
      <BCard class="mb-3 p-0">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center p-3">
          <div class="mb-2 mb-md-0">
            <h5 class="m-0 font-weight-bold">
              Overall Monthly Average: ${{ formatCurrency(overallAverage) }}
            </h5>
          </div>
          <div class="text-md-end">
            <h5 class="m-0 font-weight-bold">
              Total Spent: ${{ formatCurrency(overallTotal) }}
            </h5>
          </div>
        </div>
      </BCard>

      <div class="mb-2">
        <div class="position-relative">
          <BFormInput
            v-model="searchQuery"
            placeholder="Search categories..."
            class="mb-2 ps-5"
          />
          <FontAwesomeIcon icon="search" class="position-absolute" style="left: 10px; top: 50%; transform: translateY(-50%); color: #6c757d;" />
        </div>
      </div>

      <BTable
        striped
        hover
        :items="tableData"
        :fields="tableFields"
        class="bg-white"
        :sort-by="[{key: 'category', order: 'asc'}]"
      >
        <template #cell(amount)="data">
          <span :class="{ 'changed-value': data.item.hasChanged }">
            ${{ formatCurrency(data.value) }}
          </span>
        </template>
        <template #cell(previousAverage)="data">
          ${{ formatCurrency(data.value) }}
        </template>
        <template #cell(currentTotal)="data">
          ${{ formatCurrency(data.value) }}
        </template>
        <template #cell(previousTotal)="data">
          ${{ formatCurrency(data.value) }}
        </template>
        <template #cell(change)="data">
          <span :class="{ 'text-success': data.value > 0, 'text-danger': data.value < 0 }">
            {{ data.value > 0 ? '+' : '' }}${{ formatCurrency(data.value) }}
          </span>
        </template>
        <template #cell(percentage)="data">
          <span :class="{ 'text-success': data.value > 0, 'text-danger': data.value < 0 }">
            {{ data.value > 0 ? '+' : '' }}{{ data.value.toFixed(1) }}%
          </span>
        </template>
      </BTable>

      <footer class="mt-4 py-3 border-top">
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">YNAB Monthly Spending Averages</small>
          <BButton 
            variant="outline-secondary" 
            @click="toggleTheme"
            class="theme-toggle"
          >
            <FontAwesomeIcon :icon="isDark ? 'sun' : 'moon'" />
            {{ isDark ? 'Light Mode' : 'Dark Mode' }}
          </BButton>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useSpendingAnalysis } from './composables/useSpendingAnalysis';
import { useTheme } from './composables/useTheme';
import { useBudget } from './composables/useBudget';
import { BFormSelect, BSpinner, BCard, BTable, BFormInput, BButton, BNavbar, BNavbarBrand, BFormRadioGroup, BFormGroup } from 'bootstrap-vue-next';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSearch, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faSearch, faMoon, faSun);

const {
  budgets,
  selectedBudgetId,
  loading: budgetLoading,
  error: budgetError,
  fetchBudgets
} = useBudget();

const {
  selectedYear,
  loading,
  error,
  fetchData,
  monthlyAverages,
  monthlyGroupAverages,
  categoryNames,
  groupNames,
  yearOverYearChanges,
  yearOverYearGroupChanges,
  currentYearTotals,
  currentYearGroupTotals,
  previousYearAverages,
  previousYearGroupAverages,
  previousYearTotals,
  previousYearGroupTotals,
  getCategoryGroupName
} = useSpendingAnalysis(selectedBudgetId);

const { isDark, toggleTheme } = useTheme();

const availableYears = ref([]);
const searchQuery = ref('');
const viewByGroup = ref(localStorage.getItem('viewByGroup') === 'true');

watch(viewByGroup, (newValue) => {
  localStorage.setItem('viewByGroup', newValue);
});

const budgetOptions = computed(() => {
  return budgets.value.map(budget => ({
    value: budget.id,
    text: budget.name
  }));
});

const tableFields = computed(() => [
  { key: 'category', label: viewByGroup.value ? 'Category Group' : 'Category', sortable: true },
  { key: 'amount', label: 'Monthly Average', sortable: true },
  { key: 'previousAverage', label: `${selectedYear.value - 1} Average`, sortable: true },
  { key: 'currentTotal', label: `${selectedYear.value} Total`, sortable: true },
  { key: 'previousTotal', label: `${selectedYear.value - 1} Total`, sortable: true },
  { key: 'change', label: 'YoY Change', sortable: true },
  { key: 'percentage', label: 'YoY %', sortable: true }
]);

const tableData = computed(() => {
  if (viewByGroup.value) {
    if (!monthlyGroupAverages.value || !groupNames.value) {
      return [];
    }

    let items = Object.entries(monthlyGroupAverages.value)
      .map(([groupId, amount]) => {
        const change = yearOverYearGroupChanges.value[groupId];
        const previousAverage = previousYearGroupAverages.value[groupId] || 0;
        const previousStoredValue = getStoredAverage(groupId, selectedYear.value);
        const hasChanged = hasValueChanged(amount, previousStoredValue);
        return {
          category: groupNames.value[groupId] || 'Unknown Group',
          amount,
          previousAverage,
          currentTotal: change?.currentTotal || 0,
          previousTotal: change?.previousTotal || 0,
          change: change?.amount || 0,
          percentage: change?.percentage || 0,
          hasChanged
        };
      });

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase().trim();
      const searchWords = query.split(/\s+/);

      items = items.filter(item => {
        const category = item.category.toLowerCase();
        return searchWords.every(word => 
          category.split(/\s+/).some(categoryWord => 
            categoryWord.includes(word)
          )
        );
      });
    }

    return items;
  } else {
    if (!monthlyAverages.value || !categoryNames.value) {
      return [];
    }

    let items = Object.entries(monthlyAverages.value)
      .map(([categoryId, amount]) => {
        const change = yearOverYearChanges.value[categoryId];
        const previousAverage = previousYearAverages.value[categoryId] || 0;
        const previousStoredValue = getStoredAverage(categoryId, selectedYear.value);
        const hasChanged = hasValueChanged(amount, previousStoredValue);
        return {
          category: categoryNames.value[categoryId] || 'Unknown Category',
          amount,
          previousAverage,
          currentTotal: change?.currentTotal || 0,
          previousTotal: change?.previousTotal || 0,
          change: change?.amount || 0,
          percentage: change?.percentage || 0,
          hasChanged
        };
      });

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase().trim();
      const searchWords = query.split(/\s+/);

      items = items.filter(item => {
        const category = item.category.toLowerCase();
        return searchWords.every(word => 
          category.split(/\s+/).some(categoryWord => 
            categoryWord.includes(word)
          )
        );
      });
    }

    return items;
  }
});

const overallAverage = computed(() => {
  if (viewByGroup.value) {
    if (!monthlyGroupAverages.value) return 0;
    return Object.values(monthlyGroupAverages.value).reduce((sum, amount) => sum + amount, 0);
  } else {
    if (!monthlyAverages.value) return 0;
    return Object.values(monthlyAverages.value).reduce((sum, amount) => sum + amount, 0);
  }
});

const overallTotal = computed(() => {
  if (viewByGroup.value) {
    if (!currentYearGroupTotals.value) return 0;
    return Object.values(currentYearGroupTotals.value).reduce((sum, amount) => sum + amount, 0);
  } else {
    if (!currentYearTotals.value) return 0;
    return Object.values(currentYearTotals.value).reduce((sum, amount) => sum + amount, 0);
  }
});

const formatCurrency = (amount) => {
  return (amount / 1000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const getStoredAverage = (id, year) => {
  const stored = localStorage.getItem(`average_${id}_${year}`);
  return stored ? parseFloat(stored) : null;
};

const storeAverage = (id, year, amount) => {
  localStorage.setItem(`average_${id}_${year}`, amount.toString());
};

const hasValueChanged = (current, previous) => {
  if (previous === null) return false;
  // Consider values different if they differ by more than 0.1%
  const threshold = Math.abs(previous) * 0.001;
  return Math.abs(current - previous) > threshold;
};

onMounted(async () => {
  // Generate years from 2020 to current year
  const currentYear = new Date().getFullYear();
  availableYears.value = Array.from(
    { length: currentYear - 2019 },
    (_, i) => ({
      value: currentYear - i,
      text: (currentYear - i).toString()
    })
  );
  
  await fetchBudgets();
  if (selectedBudgetId.value) {
    fetchData();
  }
});
</script>

<style>
@import 'bootstrap/dist/css/bootstrap.css';
@import '@fortawesome/fontawesome-free/css/all.min.css';

.navbar {
  background-color: var(--bs-dark) !important;
}

.navbar-brand {
  color: var(--bs-light) !important;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
}

[data-bs-theme="dark"] .theme-toggle {
  background-color: var(--bs-dark);
  border-color: var(--bs-gray-600);
  color: var(--bs-light);
}

[data-bs-theme="dark"] .theme-toggle:hover {
  background-color: var(--bs-gray-800);
  border-color: var(--bs-gray-500);
}

[data-bs-theme="dark"] .bg-white {
  background-color: var(--bs-dark) !important;
}

[data-bs-theme="dark"] .table {
  color: var(--bs-light);
}

[data-bs-theme="dark"] .table-striped > tbody > tr:nth-of-type(odd) {
  background-color: var(--bs-gray-900);
}

.changed-value {
  background-color: #fff3cd;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: bold;
}

[data-bs-theme="dark"] .changed-value {
  background-color: #664d03;
}
</style> 