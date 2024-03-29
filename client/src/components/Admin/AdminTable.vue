<template>
  <div>
    <div class="card">
      <Toolbar class="p-mb-4">
        <template #left v-if="showHeaderButtons">
          <Button
            label="New"
            icon="pi pi-plus"
            class="p-button-success p-mr-2"
            @click="openNew"
            :disabled="disabledCreateButton"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            class="p-button-danger"
            @click="confirmDeleteSelected"
            :disabled="!selectedItems || !selectedItems.length"
          />
        </template>

        <template #right>
          <Button
            label="Export"
            icon="pi pi-upload"
            class="p-button-help"
            @click="exportCSV(selectedItems)"
            :disabled="!selectedItems || !selectedItems.length"
          />
        </template>
      </Toolbar>

      <DataTable
        ref="dt"
        :value="data"
        v-model:selection="selectedItems"
        dataKey="_id"
        :paginator="true"
        :rows="10"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        responsiveLayout="scroll"
      >
        <template #header>
          <div
            class="
              table-header
              p-d-flex p-flex-column p-flex-md-row p-jc-md-between
            "
          >
            <h5 class="p-mb-2 p-m-md-0 p-as-md-center">{{ title }}</h5>
            <span class="p-input-icon-left">
              <i class="pi pi-search" />
              <InputText placeholder="Search..." v-model.trim="search" />
            </span>
          </div>
        </template>

        <Column
          selectionMode="multiple"
          style="width: 3rem"
          :exportable="false"
        ></Column>

        <slot name="content"></slot>
        <Column :exportable="false" v-if="showTableButtons">
          <template #body="slotProps">
            <Button
              icon="pi pi-pencil"
              class="p-button-rounded p-button-success p-mr-2"
              @click="editItem(slotProps.data)"
            />
            <Button
              icon="pi pi-trash"
              class="p-button-rounded p-button-warning"
              @click="confirmDeleteItem(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    <slot name="modal"></slot>
    <Dialog
      v-model:visible="deleteItemDialog"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle p-mr-3" style="font-size: 2rem" />
        <span v-if="item"
          >Are you sure you want to delete entry with id <b>{{ item._id }}</b
          >?</span
        >
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          class="p-button-text"
          @click="deleteItemDialog = false"
        />
        <Button
          label="Yes"
          icon="pi pi-check"
          class="p-button-text"
          @click="deleteItem"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="deleteItemsDialog"
      :style="{ width: '450px' }"
      header="Confirm"
      :modal="true"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle p-mr-3" style="font-size: 2rem" />
        <span v-if="item"
          >Are you sure you want to delete the selected entries?</span
        >
      </div>
      <template #footer>
        <Button
          label="No"
          icon="pi pi-times"
          class="p-button-text"
          @click="deleteItemsDialog = false"
        />
        <Button
          label="Yes"
          icon="pi pi-check"
          class="p-button-text"
          @click="deleteSelectedItems"
        />
      </template>
    </Dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedItems: null,
      item: {},
      items: null,
      deleteItemDialog: false,
      deleteItemsDialog: false,
      submitted: false,
    };
  },
  props: {
    title: {
      type: String,
      default: "Items",
    },
    data: {
      type: Array,
      required: true,
    },
    disabledCreateButton: {
      type: Boolean,
      default: false,
    },

    searchQuery: {
      type: String,
    },

    showTableButtons: {
      type: Boolean,
      default: true,
    },

    showHeaderButtons: {
      type: Boolean,
      default: true,
    },

    typeTableButton: {
      type: String,
    },
  },

  computed: {
    search: {
      get() {
        return this.searchQuery;
      },
      set(value) {
        this.$emit("update:searchQuery", value);
      },
    },
  },

  methods: {
    confirmDeleteItem(item) {
      this.item = item;
      this.deleteItemDialog = true;
    },

    confirmDeleteSelected() {
      this.deleteItemsDialog = true;
    },

    deleteItem() {
      this.$emit("deleteItem", this.item);
      this.deleteItemDialog = false;
      this.item = {};
    },

    deleteSelectedItems() {
      this.$emit("deleteItems", this.selectedItems);
      this.deleteItemsDialog = false;
      this.selectedItems = null;
    },

    openNew() {
      this.item = {};
      this.submitted = false;
      this.$emit("openModal");
    },

    hideDialog() {
      this.itemDialog = false;
      this.submitted = false;
    },

    editItem(item) {
      this.item = { ...item };
      this.$emit("openEditModal", this.item);
    },

    exportCSV(arrData) {
      // this.$refs.dt.exportCSV();
      if (arrData) {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += [
          Object.keys(arrData[0]).join(";"),
          ...arrData.map((item) => Object.values(item).join(";")),
        ]
          .join("\n")
          .replace(/(^\[)|(\]$)/gm, "");

        const data = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", data);
        link.setAttribute("download", "export.csv");
        link.click();
      }
    },
  },
};
</script>

<style></style>
