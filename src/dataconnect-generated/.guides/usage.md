# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateUserFromGoogle, useSetUserType, useSelectMyColorScheme, useClearMyColorScheme, useSelectMyPerformanceMode, useSelectMyBackgroundOpacity, useSelectMyExternalAccountLinkTemplate, useSelectMyCardStyle, useSelectMySquareCorners, useSelectMyBordersEnabled } from '@financeconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateUserFromGoogle(createUserFromGoogleVars);

const { data, isPending, isSuccess, isError, error } = useSetUserType(setUserTypeVars);

const { data, isPending, isSuccess, isError, error } = useSelectMyColorScheme(selectMyColorSchemeVars);

const { data, isPending, isSuccess, isError, error } = useClearMyColorScheme();

const { data, isPending, isSuccess, isError, error } = useSelectMyPerformanceMode(selectMyPerformanceModeVars);

const { data, isPending, isSuccess, isError, error } = useSelectMyBackgroundOpacity(selectMyBackgroundOpacityVars);

const { data, isPending, isSuccess, isError, error } = useSelectMyExternalAccountLinkTemplate(selectMyExternalAccountLinkTemplateVars);

const { data, isPending, isSuccess, isError, error } = useSelectMyCardStyle(selectMyCardStyleVars);

const { data, isPending, isSuccess, isError, error } = useSelectMySquareCorners(selectMySquareCornersVars);

const { data, isPending, isSuccess, isError, error } = useSelectMyBordersEnabled(selectMyBordersEnabledVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUserFromGoogle, setUserType, selectMyColorScheme, clearMyColorScheme, selectMyPerformanceMode, selectMyBackgroundOpacity, selectMyExternalAccountLinkTemplate, selectMyCardStyle, selectMySquareCorners, selectMyBordersEnabled } from '@financeconnect/generated';


// Operation CreateUserFromGoogle:  For variables, look at type CreateUserFromGoogleVars in ../index.d.ts
const { data } = await CreateUserFromGoogle(dataConnect, createUserFromGoogleVars);

// Operation SetUserType:  For variables, look at type SetUserTypeVars in ../index.d.ts
const { data } = await SetUserType(dataConnect, setUserTypeVars);

// Operation SelectMyColorScheme:  For variables, look at type SelectMyColorSchemeVars in ../index.d.ts
const { data } = await SelectMyColorScheme(dataConnect, selectMyColorSchemeVars);

// Operation ClearMyColorScheme: 
const { data } = await ClearMyColorScheme(dataConnect);

// Operation SelectMyPerformanceMode:  For variables, look at type SelectMyPerformanceModeVars in ../index.d.ts
const { data } = await SelectMyPerformanceMode(dataConnect, selectMyPerformanceModeVars);

// Operation SelectMyBackgroundOpacity:  For variables, look at type SelectMyBackgroundOpacityVars in ../index.d.ts
const { data } = await SelectMyBackgroundOpacity(dataConnect, selectMyBackgroundOpacityVars);

// Operation SelectMyExternalAccountLinkTemplate:  For variables, look at type SelectMyExternalAccountLinkTemplateVars in ../index.d.ts
const { data } = await SelectMyExternalAccountLinkTemplate(dataConnect, selectMyExternalAccountLinkTemplateVars);

// Operation SelectMyCardStyle:  For variables, look at type SelectMyCardStyleVars in ../index.d.ts
const { data } = await SelectMyCardStyle(dataConnect, selectMyCardStyleVars);

// Operation SelectMySquareCorners:  For variables, look at type SelectMySquareCornersVars in ../index.d.ts
const { data } = await SelectMySquareCorners(dataConnect, selectMySquareCornersVars);

// Operation SelectMyBordersEnabled:  For variables, look at type SelectMyBordersEnabledVars in ../index.d.ts
const { data } = await SelectMyBordersEnabled(dataConnect, selectMyBordersEnabledVars);


```