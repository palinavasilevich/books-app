<template>
  <header class="header">
    <div class="header__logo">
      <h1 class="header__logo__title">
        <router-link style="text-decoration: none; color: #000" to="/"
          >Books App</router-link
        >
      </h1>
    </div>
    <nav class="header__nav">
      <div style="display: flex; align-items: center">
        <slot></slot>
      </div>
    </nav>
  </header>
</template>

<script>
export default {};
</script>
