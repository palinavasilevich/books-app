<template>
  <div>
    <my-button
      style="padding: 0; margin: 0"
      @click="displayActions = !displayActions"
    >
      <h5 class="button-title">Books actions</h5></my-button
    >
    <Timeline
      :value="data"
      v-if="displayActions"
      class="customized-timeline"
      style="align-items: flex-start"
    >
      <template #opposite="slotProps">
        <small
          class="p-text-secondary"
          style="display: block; width: max-content"
          >{{
            moment(slotProps.item.action_date).format("YYYY-MM-DD HH:mm")
          }}</small
        >
      </template>
      <template #marker="slotProps">
        <span
          class="custom-marker p-shadow-2"
          :style="{
            backgroundColor: icons.find(
              (item) => item.status === slotProps.item.status
            )?.color,
          }"
        >
          <i
            :class="
              icons.find((item) => item.status === slotProps.item.status)?.icon
            "
          ></i>
        </span>
      </template>
      <template #content="slotProps">
        {{ slotProps.item.status }}
      </template>
    </Timeline>
  </div>
</template>

<script>
import moment from "moment";
export default {
  name: "book-actions-user-page",
  data() {
    return {
      moment,
      displayActions: true,
    };
  },
  props: {
    data: {
      type: Object,
      required: true,
    },
    icons: {
      type: Array,
    },
  },

  methods: {
    getBackgroundColorIcon(action) {
      return this.icons.find((item) => item.action === action)?.color;
    },

    getIcon(action) {
      return this.icons.find((item) => item.action === action)?.icon;
    },
  },
};
</script>

<style lang="scss" scoped>
.button-title:hover {
  color: #f66e5e;
}

.custom-marker {
  display: flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  border-radius: 50%;
  z-index: 1;
}

::v-deep(.customized-timeline) {
  .p-timeline-event-opposite {
    padding-left: 0 !important;
  }
}

::v-deep(.p-timeline-event-content) ::v-deep(.p-timeline-event-opposite) {
  line-height: 1;
}

@media screen and (max-width: 960px) {
  ::v-deep(.customized-timeline) {
    .p-timeline-event:nth-child(even) {
      flex-direction: row !important;

      .p-timeline-event-content {
        text-align: left !important;
      }
    }

    .p-timeline-event-opposite {
      flex: 0;
    }

    .p-card {
      margin-top: 1rem;
    }
  }
}
</style>