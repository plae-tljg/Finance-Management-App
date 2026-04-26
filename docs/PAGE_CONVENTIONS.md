# Page Creation Conventions

This document outlines the standard conventions for creating new pages in the Finance Management App to ensure consistency and avoid common issues.

## Page File Structure

### Do NOT Use Folder-Based Routing for Pages

**Problem:** Creating a page as `folder/index.tsx` causes expo-router to generate duplicate headers (one from the folder route, one from custom HeaderCard).

**Correct Approach:**
- Create pages as standalone files: `app/page-name.tsx`
- Avoid: `app/folder/index.tsx` (creates implicit route `folder`)
- If you need multiple related pages, use flat files with descriptive names:
  - `app/accounts.tsx` (main accounts page)
  - `app/accounts-monthly-balances.tsx` (monthly balances)
  - `app/accounts-detail.tsx` (detail page)

### Route Groups Are Fine

Route groups like `(tabs)` are acceptable because they don't create URL paths.

## Use PageTemplate Component

**Always use `PageTemplate`** from `@/components/base/PageTemplate` for all standard pages.

```tsx
import { PageTemplate } from '@/components/base/PageTemplate';

export default function MyPage() {
  return (
    <PageTemplate
      title="页面标题"
      showBack={true}  // Show/hide back button
      rightAccessory={<SomeIcon />}  // Optional right-side element
      footer={<SomeButton />}  // Optional footer button
    >
      {/* Page content */}
    </PageTemplate>
  );
}
```

### PageTemplate Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Header title |
| `showBack` | boolean | true | Show back button |
| `onBack` | () => void | router.back() | Custom back handler |
| `leftAccessory` | ReactNode | undefined | Left side element (e.g., month navigation arrows) |
| `rightAccessory` | ReactNode | undefined | Right side element |
| `children` | ReactNode | required | Page content |
| `footer` | ReactNode | undefined | Footer element (e.g., save button) |
| `scrollable` | boolean | true | Enable scroll view. **Set to false when page contains FlatList or list components** |

## Pages with FlatList/List Components

**IMPORTANT**: Pages that use FlatList, SectionList, or custom List components (like `TransactionList`, `BudgetList`) **must** set `scrollable={false}` to avoid the VirtualizedList warning:

```tsx
export default function TransactionsPage() {
  return (
    <PageTemplate title="交易记录" scrollable={false}>
      <TransactionList ... />
    </PageTemplate>
  );
}
```

## What PageTemplate Provides

- `BackgroundImage` wrapper (background styling)
- `SafeAreaView` with `edges={['top', 'bottom']}` (proper insets for Android nav bar)
- Consistent header with back button
- Automatic bottom padding (80px) to prevent overlap with Android navigation bar
- Scroll view for content

## Common Mistakes to Avoid

### ❌ Don't Do This
```tsx
// WRONG - creates duplicate headers
export default function Page() {
  return (
    <BackgroundImage>
      <SafeAreaView edges={['top']}>
        <HeaderCard title="Title" />
        {/* content */}
      </SafeAreaView>
    </BackgroundImage>
  );
}
```

### ✅ Do This Instead
```tsx
// CORRECT - uses PageTemplate
export default function Page() {
  return (
    <PageTemplate title="Title">
      {/* content */}
    </PageTemplate>
  );
}
```

## Handling Loading States

```tsx
if (isLoading) {
  return (
    <PageTemplate title="加载中..." showBack={false}>
      <Text>加载中...</Text>
    </PageTemplate>
  );
}
```

## Adding Footer Buttons

```tsx
return (
  <PageTemplate
    title="页面标题"
    footer={
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
    }
  >
    {/* content */}
  </PageTemplate>
);
```

## Modal Handling

Modals should be rendered outside the PageTemplate content:

```tsx
return (
  <PageTemplate title="页面标题">
    {/* main content */}

    <Modal visible={modalVisible} ...>
      <SomeForm />
    </Modal>
  </PageTemplate>
);
```

## For Tab Pages

Tab pages (under `app/(tabs)/`) should also use PageTemplate but with `showBack={false}` since tabs don't need back navigation.

```tsx
export default function TabPage() {
  return (
    <PageTemplate title="Tab Title" showBack={false}>
      {/* content */}
    </PageTemplate>
  );
}
```

## Import Order

When writing page files, use this import order:
1. React/core imports
2. expo-router imports
3. Third-party library imports (SafeAreaProvider, etc.)
4. Internal imports (@/components, @/services, etc.)
5. Type imports

## Summary

1. **Use PageTemplate** for all standard pages
2. **Avoid folder/index.tsx pattern** - creates duplicate headers
3. **Use edges={['top', 'bottom']}** - prevents Android nav bar overlap
4. **Use rightAccessory** for add/edit buttons, not separate View containers
5. **Use footer prop** for save/submit buttons at bottom of page