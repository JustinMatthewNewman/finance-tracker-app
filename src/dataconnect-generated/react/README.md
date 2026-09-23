# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `finance`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dataconnect-generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@financeconnect/generated/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListUsers*](#listusers)
  - [*GetMyUser*](#getmyuser)
  - [*ListColorSchemes*](#listcolorschemes)
  - [*ListUserTypes*](#listusertypes)
  - [*GetUserAccessByGoogleUid*](#getuseraccessbygoogleuid)
  - [*GetUserProvisioningByGoogleUid*](#getuserprovisioningbygoogleuid)
  - [*ListFamilyMembers*](#listfamilymembers)
  - [*ListCategories*](#listcategories)
  - [*ListTransactionsByFamilyMember*](#listtransactionsbyfamilymember)
  - [*ListMyTransactions*](#listmytransactions)
  - [*ListMyTransactionsByDateRange*](#listmytransactionsbydaterange)
  - [*GetFamilyByInviteCode*](#getfamilybyinvitecode)
  - [*GetMyFamilyDetail*](#getmyfamilydetail)
  - [*GetMyJoinRequests*](#getmyjoinrequests)
- [**Mutations**](#mutations)
  - [*CreateUserFromGoogle*](#createuserfromgoogle)
  - [*SetUserType*](#setusertype)
  - [*SelectMyColorScheme*](#selectmycolorscheme)
  - [*ClearMyColorScheme*](#clearmycolorscheme)
  - [*SelectMyPerformanceMode*](#selectmyperformancemode)
  - [*SelectMyBackgroundOpacity*](#selectmybackgroundopacity)
  - [*SelectMyExternalAccountLinkTemplate*](#selectmyexternalaccountlinktemplate)
  - [*SelectMyCardStyle*](#selectmycardstyle)
  - [*SelectMySquareCorners*](#selectmysquarecorners)
  - [*SelectMyBordersEnabled*](#selectmybordersenabled)
  - [*SelectMyCategoryColorsEnabled*](#selectmycategorycolorsenabled)
  - [*SelectMyCurrency*](#selectmycurrency)
  - [*CreateFamilyMember*](#createfamilymember)
  - [*UpdateFamilyMember*](#updatefamilymember)
  - [*RenameFamilyMember*](#renamefamilymember)
  - [*DeleteFamilyMember*](#deletefamilymember)
  - [*UpsertCategory*](#upsertcategory)
  - [*UpdateCategory*](#updatecategory)
  - [*CreateTransaction*](#createtransaction)
  - [*UpdateTransaction*](#updatetransaction)
  - [*UpdateTransactionClearCategory*](#updatetransactionclearcategory)
  - [*MarkTransactionPosted*](#marktransactionposted)
  - [*MarkTransactionProjected*](#marktransactionprojected)
  - [*DeleteTransaction*](#deletetransaction)
  - [*CreateFamily*](#createfamily)
  - [*RequestToJoinFamily*](#requesttojoinfamily)
  - [*ApproveJoinRequest*](#approvejoinrequest)
  - [*DenyJoinRequest*](#denyjoinrequest)
  - [*CancelMyJoinRequest*](#cancelmyjoinrequest)
  - [*LeaveMyFamily*](#leavemyfamily)
  - [*RegenerateFamilyInviteCode*](#regeneratefamilyinvitecode)
  - [*CreateUserSettingForUser*](#createusersettingforuser)
  - [*CreateSelfFamilyMemberForUser*](#createselffamilymemberforuser)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `finance`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `finance`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `finance` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## ListUsers
You can execute the `ListUsers` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListUsers(options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;
```

### Variables
The `ListUsers` Query has no variables.
### Return Type
Recall that calling the `ListUsers` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListUsers` Query is of type `ListUsersData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListUsersData {
  users: ({
    id: UUIDString;
    googleUid: string;
    username: string;
    email?: string | null;
    userTypeName: string;
    createdAt: TimestampString;
  } & User_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListUsers`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';
import { useListUsers } from '@financeconnect/generated/react'

export default function ListUsersComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListUsers();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListUsers(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListUsers(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListUsers(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.users);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetMyUser
You can execute the `GetMyUser` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMyUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyUserData>): UseDataConnectQueryResult<GetMyUserData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMyUser(options?: useDataConnectQueryOptions<GetMyUserData>): UseDataConnectQueryResult<GetMyUserData, undefined>;
```

### Variables
The `GetMyUser` Query has no variables.
### Return Type
Recall that calling the `GetMyUser` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMyUser` Query is of type `GetMyUserData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetMyUserData {
  user?: {
    id: UUIDString;
    googleUid: string;
    username: string;
    email?: string | null;
    createdAt: TimestampString;
    userSetting?: {
      id: UUIDString;
      performanceMode?: boolean | null;
      backgroundOpacity?: number | null;
      externalAccountLinkTemplate?: string | null;
      cardOpacity?: number | null;
      cardBlur?: number | null;
      bordersEnabled?: boolean | null;
      categoryColorsEnabled?: boolean | null;
      squareCorners?: boolean | null;
      currencyCode?: string | null;
      colorScheme?: {
        id: UUIDString;
        name: string;
      } & ColorScheme_Key;
    } & UserSetting_Key;
    userType: {
      name: string;
      features: ({
        name: string;
        description?: string | null;
      } & Feature_Key)[];
    } & UserType_Key;
    family?: {
      id: UUIDString;
      name: string;
      inviteCode: string;
      ownerUser: {
        id: UUIDString;
        username: string;
      } & User_Key;
    } & Family_Key;
  } & User_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMyUser`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';
import { useGetMyUser } from '@financeconnect/generated/react'

export default function GetMyUserComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMyUser();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMyUser(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyUser(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.user);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListColorSchemes
You can execute the `ListColorSchemes` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListColorSchemes(dc: DataConnect, options?: useDataConnectQueryOptions<ListColorSchemesData>): UseDataConnectQueryResult<ListColorSchemesData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListColorSchemes(options?: useDataConnectQueryOptions<ListColorSchemesData>): UseDataConnectQueryResult<ListColorSchemesData, undefined>;
```

### Variables
The `ListColorSchemes` Query has no variables.
### Return Type
Recall that calling the `ListColorSchemes` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListColorSchemes` Query is of type `ListColorSchemesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListColorSchemesData {
  colorSchemes: ({
    id: UUIDString;
    name: string;
    themes: ({
      id: UUIDString;
      isDark: boolean;
      background: string;
      foreground: string;
      surface: string;
      surfaceForeground: string;
      overlay: string;
      overlayForeground: string;
      muted: string;
      default: string;
      defaultForeground: string;
      accent: string;
      accentForeground: string;
      border: string;
      separator: string;
    } & Theme_Key)[];
  } & ColorScheme_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListColorSchemes`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';
import { useListColorSchemes } from '@financeconnect/generated/react'

export default function ListColorSchemesComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListColorSchemes();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListColorSchemes(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListColorSchemes(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListColorSchemes(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.colorSchemes);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListUserTypes
You can execute the `ListUserTypes` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListUserTypes(dc: DataConnect, options?: useDataConnectQueryOptions<ListUserTypesData>): UseDataConnectQueryResult<ListUserTypesData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListUserTypes(options?: useDataConnectQueryOptions<ListUserTypesData>): UseDataConnectQueryResult<ListUserTypesData, undefined>;
```

### Variables
The `ListUserTypes` Query has no variables.
### Return Type
Recall that calling the `ListUserTypes` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListUserTypes` Query is of type `ListUserTypesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListUserTypesData {
  userTypes: ({
    id: UUIDString;
    name: string;
    createdAt: TimestampString;
  } & UserType_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListUserTypes`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';
import { useListUserTypes } from '@financeconnect/generated/react'

export default function ListUserTypesComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListUserTypes();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListUserTypes(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListUserTypes(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListUserTypes(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userTypes);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetUserAccessByGoogleUid
You can execute the `GetUserAccessByGoogleUid` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetUserAccessByGoogleUid(dc: DataConnect, vars: GetUserAccessByGoogleUidVariables, options?: useDataConnectQueryOptions<GetUserAccessByGoogleUidData>): UseDataConnectQueryResult<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetUserAccessByGoogleUid(vars: GetUserAccessByGoogleUidVariables, options?: useDataConnectQueryOptions<GetUserAccessByGoogleUidData>): UseDataConnectQueryResult<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;
```

### Variables
The `GetUserAccessByGoogleUid` Query requires an argument of type `GetUserAccessByGoogleUidVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetUserAccessByGoogleUidVariables {
  googleUid: string;
}
```
### Return Type
Recall that calling the `GetUserAccessByGoogleUid` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetUserAccessByGoogleUid` Query is of type `GetUserAccessByGoogleUidData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetUserAccessByGoogleUidData {
  user?: {
    id: UUIDString;
    username: string;
    userType: {
      name: string;
      features: ({
        name: string;
      } & Feature_Key)[];
    } & UserType_Key;
  } & User_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetUserAccessByGoogleUid`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetUserAccessByGoogleUidVariables } from '@financeconnect/generated';
import { useGetUserAccessByGoogleUid } from '@financeconnect/generated/react'

export default function GetUserAccessByGoogleUidComponent() {
  // The `useGetUserAccessByGoogleUid` Query hook requires an argument of type `GetUserAccessByGoogleUidVariables`:
  const getUserAccessByGoogleUidVars: GetUserAccessByGoogleUidVariables = {
    googleUid: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetUserAccessByGoogleUid(getUserAccessByGoogleUidVars);
  // Variables can be defined inline as well.
  const query = useGetUserAccessByGoogleUid({ googleUid: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetUserAccessByGoogleUid(dataConnect, getUserAccessByGoogleUidVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserAccessByGoogleUid(getUserAccessByGoogleUidVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserAccessByGoogleUid(dataConnect, getUserAccessByGoogleUidVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.user);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetUserProvisioningByGoogleUid
You can execute the `GetUserProvisioningByGoogleUid` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetUserProvisioningByGoogleUid(dc: DataConnect, vars: GetUserProvisioningByGoogleUidVariables, options?: useDataConnectQueryOptions<GetUserProvisioningByGoogleUidData>): UseDataConnectQueryResult<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetUserProvisioningByGoogleUid(vars: GetUserProvisioningByGoogleUidVariables, options?: useDataConnectQueryOptions<GetUserProvisioningByGoogleUidData>): UseDataConnectQueryResult<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;
```

### Variables
The `GetUserProvisioningByGoogleUid` Query requires an argument of type `GetUserProvisioningByGoogleUidVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetUserProvisioningByGoogleUidVariables {
  googleUid: string;
}
```
### Return Type
Recall that calling the `GetUserProvisioningByGoogleUid` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetUserProvisioningByGoogleUid` Query is of type `GetUserProvisioningByGoogleUidData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetUserProvisioningByGoogleUidData {
  user?: {
    id: UUIDString;
    username: string;
    userSetting?: {
      id: UUIDString;
    } & UserSetting_Key;
    selfMember?: {
      id: UUIDString;
    } & FamilyMember_Key;
  } & User_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetUserProvisioningByGoogleUid`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetUserProvisioningByGoogleUidVariables } from '@financeconnect/generated';
import { useGetUserProvisioningByGoogleUid } from '@financeconnect/generated/react'

export default function GetUserProvisioningByGoogleUidComponent() {
  // The `useGetUserProvisioningByGoogleUid` Query hook requires an argument of type `GetUserProvisioningByGoogleUidVariables`:
  const getUserProvisioningByGoogleUidVars: GetUserProvisioningByGoogleUidVariables = {
    googleUid: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetUserProvisioningByGoogleUid(getUserProvisioningByGoogleUidVars);
  // Variables can be defined inline as well.
  const query = useGetUserProvisioningByGoogleUid({ googleUid: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetUserProvisioningByGoogleUid(dataConnect, getUserProvisioningByGoogleUidVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserProvisioningByGoogleUid(getUserProvisioningByGoogleUidVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetUserProvisioningByGoogleUid(dataConnect, getUserProvisioningByGoogleUidVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.user);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListFamilyMembers
You can execute the `ListFamilyMembers` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListFamilyMembers(dc: DataConnect, vars?: ListFamilyMembersVariables, options?: useDataConnectQueryOptions<ListFamilyMembersData>): UseDataConnectQueryResult<ListFamilyMembersData, ListFamilyMembersVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListFamilyMembers(vars?: ListFamilyMembersVariables, options?: useDataConnectQueryOptions<ListFamilyMembersData>): UseDataConnectQueryResult<ListFamilyMembersData, ListFamilyMembersVariables>;
```

### Variables
The `ListFamilyMembers` Query has an optional argument of type `ListFamilyMembersVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListFamilyMembersVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListFamilyMembers` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListFamilyMembers` Query is of type `ListFamilyMembersData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListFamilyMembersData {
  familyMembers: ({
    id: UUIDString;
    name: string;
    relationship?: string | null;
    color?: string | null;
    externalAccountRef?: string | null;
    monthlyIncomeTargetMinor?: number | null;
    createdAt: TimestampString;
    user: {
      id: UUIDString;
      username: string;
    } & User_Key;
    selfUser?: {
      id: UUIDString;
    } & User_Key;
  } & FamilyMember_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListFamilyMembers`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListFamilyMembersVariables } from '@financeconnect/generated';
import { useListFamilyMembers } from '@financeconnect/generated/react'

export default function ListFamilyMembersComponent() {
  // The `useListFamilyMembers` Query hook has an optional argument of type `ListFamilyMembersVariables`:
  const listFamilyMembersVars: ListFamilyMembersVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListFamilyMembers(listFamilyMembersVars);
  // Variables can be defined inline as well.
  const query = useListFamilyMembers({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListFamilyMembersVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListFamilyMembers();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListFamilyMembers(dataConnect, listFamilyMembersVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListFamilyMembers(listFamilyMembersVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListFamilyMembers(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListFamilyMembers(dataConnect, listFamilyMembersVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.familyMembers);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListCategories
You can execute the `ListCategories` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListCategories(dc: DataConnect, vars?: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListCategories(vars?: ListCategoriesVariables, options?: useDataConnectQueryOptions<ListCategoriesData>): UseDataConnectQueryResult<ListCategoriesData, ListCategoriesVariables>;
```

### Variables
The `ListCategories` Query has an optional argument of type `ListCategoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListCategoriesVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListCategories` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListCategories` Query is of type `ListCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListCategoriesData {
  categories: ({
    id: UUIDString;
    name: string;
    kind: string;
    parentGroup?: string | null;
    color?: string | null;
    createdAt: TimestampString;
  } & Category_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListCategories`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListCategoriesVariables } from '@financeconnect/generated';
import { useListCategories } from '@financeconnect/generated/react'

export default function ListCategoriesComponent() {
  // The `useListCategories` Query hook has an optional argument of type `ListCategoriesVariables`:
  const listCategoriesVars: ListCategoriesVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListCategories(listCategoriesVars);
  // Variables can be defined inline as well.
  const query = useListCategories({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListCategoriesVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListCategories();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListCategories(dataConnect, listCategoriesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListCategories(listCategoriesVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListCategories(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListCategories(dataConnect, listCategoriesVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.categories);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListTransactionsByFamilyMember
You can execute the `ListTransactionsByFamilyMember` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListTransactionsByFamilyMember(dc: DataConnect, vars: ListTransactionsByFamilyMemberVariables, options?: useDataConnectQueryOptions<ListTransactionsByFamilyMemberData>): UseDataConnectQueryResult<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListTransactionsByFamilyMember(vars: ListTransactionsByFamilyMemberVariables, options?: useDataConnectQueryOptions<ListTransactionsByFamilyMemberData>): UseDataConnectQueryResult<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;
```

### Variables
The `ListTransactionsByFamilyMember` Query requires an argument of type `ListTransactionsByFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListTransactionsByFamilyMemberVariables {
  familyMemberId: UUIDString;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListTransactionsByFamilyMember` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListTransactionsByFamilyMember` Query is of type `ListTransactionsByFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListTransactionsByFamilyMemberData {
  transactions: ({
    id: UUIDString;
    amountMinor: number;
    direction: string;
    occurredOn: DateString;
    description?: string | null;
    merchant?: string | null;
    method?: string | null;
    recurrence?: string | null;
    source: string;
    status: string;
    createdAt: TimestampString;
    familyMember: {
      id: UUIDString;
      name: string;
    } & FamilyMember_Key;
    category?: {
      id: UUIDString;
      name: string;
      kind: string;
      color?: string | null;
    } & Category_Key;
    user: {
      id: UUIDString;
      username: string;
    } & User_Key;
  } & Transaction_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListTransactionsByFamilyMember`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListTransactionsByFamilyMemberVariables } from '@financeconnect/generated';
import { useListTransactionsByFamilyMember } from '@financeconnect/generated/react'

export default function ListTransactionsByFamilyMemberComponent() {
  // The `useListTransactionsByFamilyMember` Query hook requires an argument of type `ListTransactionsByFamilyMemberVariables`:
  const listTransactionsByFamilyMemberVars: ListTransactionsByFamilyMemberVariables = {
    familyMemberId: ..., 
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListTransactionsByFamilyMember(listTransactionsByFamilyMemberVars);
  // Variables can be defined inline as well.
  const query = useListTransactionsByFamilyMember({ familyMemberId: ..., limit: ..., offset: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListTransactionsByFamilyMember(dataConnect, listTransactionsByFamilyMemberVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListTransactionsByFamilyMember(listTransactionsByFamilyMemberVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListTransactionsByFamilyMember(dataConnect, listTransactionsByFamilyMemberVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.transactions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMyTransactions
You can execute the `ListMyTransactions` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMyTransactions(dc: DataConnect, vars?: ListMyTransactionsVariables, options?: useDataConnectQueryOptions<ListMyTransactionsData>): UseDataConnectQueryResult<ListMyTransactionsData, ListMyTransactionsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMyTransactions(vars?: ListMyTransactionsVariables, options?: useDataConnectQueryOptions<ListMyTransactionsData>): UseDataConnectQueryResult<ListMyTransactionsData, ListMyTransactionsVariables>;
```

### Variables
The `ListMyTransactions` Query has an optional argument of type `ListMyTransactionsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListMyTransactionsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListMyTransactions` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMyTransactions` Query is of type `ListMyTransactionsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListMyTransactionsData {
  transactions: ({
    id: UUIDString;
    amountMinor: number;
    direction: string;
    occurredOn: DateString;
    description?: string | null;
    merchant?: string | null;
    method?: string | null;
    recurrence?: string | null;
    source: string;
    status: string;
    createdAt: TimestampString;
    familyMember: {
      id: UUIDString;
      name: string;
    } & FamilyMember_Key;
    category?: {
      id: UUIDString;
      name: string;
      kind: string;
      color?: string | null;
    } & Category_Key;
    user: {
      id: UUIDString;
      username: string;
    } & User_Key;
  } & Transaction_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMyTransactions`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListMyTransactionsVariables } from '@financeconnect/generated';
import { useListMyTransactions } from '@financeconnect/generated/react'

export default function ListMyTransactionsComponent() {
  // The `useListMyTransactions` Query hook has an optional argument of type `ListMyTransactionsVariables`:
  const listMyTransactionsVars: ListMyTransactionsVariables = {
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMyTransactions(listMyTransactionsVars);
  // Variables can be defined inline as well.
  const query = useListMyTransactions({ limit: ..., offset: ..., });
  // Since all variables are optional for this Query, you can omit the `ListMyTransactionsVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useListMyTransactions();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMyTransactions(dataConnect, listMyTransactionsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMyTransactions(listMyTransactionsVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useListMyTransactions(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMyTransactions(dataConnect, listMyTransactionsVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.transactions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMyTransactionsByDateRange
You can execute the `ListMyTransactionsByDateRange` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMyTransactionsByDateRange(dc: DataConnect, vars: ListMyTransactionsByDateRangeVariables, options?: useDataConnectQueryOptions<ListMyTransactionsByDateRangeData>): UseDataConnectQueryResult<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMyTransactionsByDateRange(vars: ListMyTransactionsByDateRangeVariables, options?: useDataConnectQueryOptions<ListMyTransactionsByDateRangeData>): UseDataConnectQueryResult<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;
```

### Variables
The `ListMyTransactionsByDateRange` Query requires an argument of type `ListMyTransactionsByDateRangeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListMyTransactionsByDateRangeVariables {
  startDate: DateString;
  endDate: DateString;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that calling the `ListMyTransactionsByDateRange` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMyTransactionsByDateRange` Query is of type `ListMyTransactionsByDateRangeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListMyTransactionsByDateRangeData {
  transactions: ({
    id: UUIDString;
    amountMinor: number;
    direction: string;
    occurredOn: DateString;
    description?: string | null;
    merchant?: string | null;
    method?: string | null;
    recurrence?: string | null;
    source: string;
    status: string;
    createdAt: TimestampString;
    familyMember: {
      id: UUIDString;
      name: string;
    } & FamilyMember_Key;
    category?: {
      id: UUIDString;
      name: string;
      kind: string;
      color?: string | null;
    } & Category_Key;
    user: {
      id: UUIDString;
      username: string;
    } & User_Key;
  } & Transaction_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMyTransactionsByDateRange`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListMyTransactionsByDateRangeVariables } from '@financeconnect/generated';
import { useListMyTransactionsByDateRange } from '@financeconnect/generated/react'

export default function ListMyTransactionsByDateRangeComponent() {
  // The `useListMyTransactionsByDateRange` Query hook requires an argument of type `ListMyTransactionsByDateRangeVariables`:
  const listMyTransactionsByDateRangeVars: ListMyTransactionsByDateRangeVariables = {
    startDate: ..., 
    endDate: ..., 
    limit: ..., // optional
    offset: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMyTransactionsByDateRange(listMyTransactionsByDateRangeVars);
  // Variables can be defined inline as well.
  const query = useListMyTransactionsByDateRange({ startDate: ..., endDate: ..., limit: ..., offset: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMyTransactionsByDateRange(dataConnect, listMyTransactionsByDateRangeVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMyTransactionsByDateRange(listMyTransactionsByDateRangeVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMyTransactionsByDateRange(dataConnect, listMyTransactionsByDateRangeVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.transactions);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetFamilyByInviteCode
You can execute the `GetFamilyByInviteCode` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetFamilyByInviteCode(dc: DataConnect, vars: GetFamilyByInviteCodeVariables, options?: useDataConnectQueryOptions<GetFamilyByInviteCodeData>): UseDataConnectQueryResult<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetFamilyByInviteCode(vars: GetFamilyByInviteCodeVariables, options?: useDataConnectQueryOptions<GetFamilyByInviteCodeData>): UseDataConnectQueryResult<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;
```

### Variables
The `GetFamilyByInviteCode` Query requires an argument of type `GetFamilyByInviteCodeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetFamilyByInviteCodeVariables {
  inviteCode: string;
}
```
### Return Type
Recall that calling the `GetFamilyByInviteCode` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetFamilyByInviteCode` Query is of type `GetFamilyByInviteCodeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetFamilyByInviteCodeData {
  family?: {
    id: UUIDString;
    name: string;
    ownerUser: {
      username: string;
    };
  } & Family_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetFamilyByInviteCode`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetFamilyByInviteCodeVariables } from '@financeconnect/generated';
import { useGetFamilyByInviteCode } from '@financeconnect/generated/react'

export default function GetFamilyByInviteCodeComponent() {
  // The `useGetFamilyByInviteCode` Query hook requires an argument of type `GetFamilyByInviteCodeVariables`:
  const getFamilyByInviteCodeVars: GetFamilyByInviteCodeVariables = {
    inviteCode: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetFamilyByInviteCode(getFamilyByInviteCodeVars);
  // Variables can be defined inline as well.
  const query = useGetFamilyByInviteCode({ inviteCode: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetFamilyByInviteCode(dataConnect, getFamilyByInviteCodeVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetFamilyByInviteCode(getFamilyByInviteCodeVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetFamilyByInviteCode(dataConnect, getFamilyByInviteCodeVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.family);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetMyFamilyDetail
You can execute the `GetMyFamilyDetail` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMyFamilyDetail(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyFamilyDetailData>): UseDataConnectQueryResult<GetMyFamilyDetailData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMyFamilyDetail(options?: useDataConnectQueryOptions<GetMyFamilyDetailData>): UseDataConnectQueryResult<GetMyFamilyDetailData, undefined>;
```

### Variables
The `GetMyFamilyDetail` Query has no variables.
### Return Type
Recall that calling the `GetMyFamilyDetail` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMyFamilyDetail` Query is of type `GetMyFamilyDetailData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetMyFamilyDetailData {
  families: ({
    id: UUIDString;
    name: string;
    inviteCode: string;
    createdAt: TimestampString;
    ownerUser: {
      id: UUIDString;
      username: string;
    } & User_Key;
    members: ({
      id: UUIDString;
      username: string;
      email?: string | null;
      createdAt: TimestampString;
    } & User_Key)[];
    pendingRequests: ({
      status: string;
      createdAt: TimestampString;
      requester: {
        id: UUIDString;
        username: string;
        email?: string | null;
      } & User_Key;
    })[];
  } & Family_Key)[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMyFamilyDetail`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';
import { useGetMyFamilyDetail } from '@financeconnect/generated/react'

export default function GetMyFamilyDetailComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMyFamilyDetail();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMyFamilyDetail(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyFamilyDetail(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyFamilyDetail(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.families);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetMyJoinRequests
You can execute the `GetMyJoinRequests` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMyJoinRequests(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyJoinRequestsData>): UseDataConnectQueryResult<GetMyJoinRequestsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMyJoinRequests(options?: useDataConnectQueryOptions<GetMyJoinRequestsData>): UseDataConnectQueryResult<GetMyJoinRequestsData, undefined>;
```

### Variables
The `GetMyJoinRequests` Query has no variables.
### Return Type
Recall that calling the `GetMyJoinRequests` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMyJoinRequests` Query is of type `GetMyJoinRequestsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetMyJoinRequestsData {
  familyJoinRequests: ({
    status: string;
    createdAt: TimestampString;
    decidedAt?: TimestampString | null;
    family: {
      id: UUIDString;
      name: string;
      ownerUser: {
        username: string;
      };
    } & Family_Key;
  })[];
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMyJoinRequests`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';
import { useGetMyJoinRequests } from '@financeconnect/generated/react'

export default function GetMyJoinRequestsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMyJoinRequests();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMyJoinRequests(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyJoinRequests(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyJoinRequests(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.familyJoinRequests);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

The React generated SDK provides Mutations hook functions that call and return [`useDataConnectMutation`](https://react-query-firebase.invertase.dev/react/data-connect/mutations) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, and the most recent data returned by the Mutation, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/mutations).

Mutation hooks do not execute their Mutations automatically when called. Rather, after calling the Mutation hook function and getting a `UseMutationResult` object, you must call the `UseMutationResult.mutate()` function to execute the Mutation.

To learn more about TanStack React Query's Mutations, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

## Using Mutation Hooks
Here's a general overview of how to use the generated Mutation hooks in your code:

- Mutation hook functions are not called with the arguments to the Mutation. Instead, arguments are passed to `UseMutationResult.mutate()`.
- If the Mutation has no variables, the `mutate()` function does not require arguments.
- If the Mutation has any required variables, the `mutate()` function will require at least one argument: an object that contains all the required variables for the Mutation.
- If the Mutation has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Mutation's variables are optional, the Mutation hook function does not require any arguments.
- Mutation hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Mutation hooks also accept an `options` argument of type `useDataConnectMutationOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations#mutation-side-effects).
  - `UseMutationResult.mutate()` also accepts an `options` argument of type `useDataConnectMutationOptions`.
  - ***Special case:*** If the Mutation has no arguments (or all optional arguments and you wish to provide none), and you want to pass `options` to `UseMutationResult.mutate()`, you must pass `undefined` where you would normally pass the Mutation's arguments, and then may provide the options argument.

Below are examples of how to use the `finance` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## CreateUserFromGoogle
You can execute the `CreateUserFromGoogle` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateUserFromGoogle(options?: useDataConnectMutationOptions<CreateUserFromGoogleData, FirebaseError, CreateUserFromGoogleVariables>): UseDataConnectMutationResult<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateUserFromGoogle(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserFromGoogleData, FirebaseError, CreateUserFromGoogleVariables>): UseDataConnectMutationResult<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;
```

### Variables
The `CreateUserFromGoogle` Mutation requires an argument of type `CreateUserFromGoogleVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateUserFromGoogleVariables {
  userId: UUIDString;
  selfFamilyMemberId: UUIDString;
  googleUid: string;
  username: string;
  email: string;
  createdAt: TimestampString;
  userTypeName?: string;
}
```
### Return Type
Recall that calling the `CreateUserFromGoogle` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateUserFromGoogle` Mutation is of type `CreateUserFromGoogleData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateUserFromGoogleData {
  userType_upsert: UserType_Key;
  user_insert: User_Key;
  familyMember_insert: FamilyMember_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateUserFromGoogle`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateUserFromGoogleVariables } from '@financeconnect/generated';
import { useCreateUserFromGoogle } from '@financeconnect/generated/react'

export default function CreateUserFromGoogleComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateUserFromGoogle();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateUserFromGoogle(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateUserFromGoogle(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateUserFromGoogle(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateUserFromGoogle` Mutation requires an argument of type `CreateUserFromGoogleVariables`:
  const createUserFromGoogleVars: CreateUserFromGoogleVariables = {
    userId: ..., 
    selfFamilyMemberId: ..., 
    googleUid: ..., 
    username: ..., 
    email: ..., 
    createdAt: ..., 
    userTypeName: ..., // optional
  };
  mutation.mutate(createUserFromGoogleVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., selfFamilyMemberId: ..., googleUid: ..., username: ..., email: ..., createdAt: ..., userTypeName: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createUserFromGoogleVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userType_upsert);
    console.log(mutation.data.user_insert);
    console.log(mutation.data.familyMember_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SetUserType
You can execute the `SetUserType` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSetUserType(options?: useDataConnectMutationOptions<SetUserTypeData, FirebaseError, SetUserTypeVariables>): UseDataConnectMutationResult<SetUserTypeData, SetUserTypeVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSetUserType(dc: DataConnect, options?: useDataConnectMutationOptions<SetUserTypeData, FirebaseError, SetUserTypeVariables>): UseDataConnectMutationResult<SetUserTypeData, SetUserTypeVariables>;
```

### Variables
The `SetUserType` Mutation requires an argument of type `SetUserTypeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SetUserTypeVariables {
  userId: UUIDString;
  userTypeName: string;
}
```
### Return Type
Recall that calling the `SetUserType` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SetUserType` Mutation is of type `SetUserTypeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SetUserTypeData {
  user_update?: User_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SetUserType`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SetUserTypeVariables } from '@financeconnect/generated';
import { useSetUserType } from '@financeconnect/generated/react'

export default function SetUserTypeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSetUserType();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSetUserType(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetUserType(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSetUserType(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSetUserType` Mutation requires an argument of type `SetUserTypeVariables`:
  const setUserTypeVars: SetUserTypeVariables = {
    userId: ..., 
    userTypeName: ..., 
  };
  mutation.mutate(setUserTypeVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., userTypeName: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(setUserTypeVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.user_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyColorScheme
You can execute the `SelectMyColorScheme` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyColorScheme(options?: useDataConnectMutationOptions<SelectMyColorSchemeData, FirebaseError, SelectMyColorSchemeVariables>): UseDataConnectMutationResult<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyColorScheme(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyColorSchemeData, FirebaseError, SelectMyColorSchemeVariables>): UseDataConnectMutationResult<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;
```

### Variables
The `SelectMyColorScheme` Mutation requires an argument of type `SelectMyColorSchemeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyColorSchemeVariables {
  colorSchemeId: UUIDString;
}
```
### Return Type
Recall that calling the `SelectMyColorScheme` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyColorScheme` Mutation is of type `SelectMyColorSchemeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyColorSchemeData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyColorScheme`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyColorSchemeVariables } from '@financeconnect/generated';
import { useSelectMyColorScheme } from '@financeconnect/generated/react'

export default function SelectMyColorSchemeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyColorScheme();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyColorScheme(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyColorScheme(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyColorScheme(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyColorScheme` Mutation requires an argument of type `SelectMyColorSchemeVariables`:
  const selectMyColorSchemeVars: SelectMyColorSchemeVariables = {
    colorSchemeId: ..., 
  };
  mutation.mutate(selectMyColorSchemeVars);
  // Variables can be defined inline as well.
  mutation.mutate({ colorSchemeId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyColorSchemeVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ClearMyColorScheme
You can execute the `ClearMyColorScheme` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useClearMyColorScheme(options?: useDataConnectMutationOptions<ClearMyColorSchemeData, FirebaseError, void>): UseDataConnectMutationResult<ClearMyColorSchemeData, undefined>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useClearMyColorScheme(dc: DataConnect, options?: useDataConnectMutationOptions<ClearMyColorSchemeData, FirebaseError, void>): UseDataConnectMutationResult<ClearMyColorSchemeData, undefined>;
```

### Variables
The `ClearMyColorScheme` Mutation has no variables.
### Return Type
Recall that calling the `ClearMyColorScheme` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ClearMyColorScheme` Mutation is of type `ClearMyColorSchemeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ClearMyColorSchemeData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ClearMyColorScheme`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';
import { useClearMyColorScheme } from '@financeconnect/generated/react'

export default function ClearMyColorSchemeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useClearMyColorScheme();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useClearMyColorScheme(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useClearMyColorScheme(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useClearMyColorScheme(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since this Mutation accepts no variables, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(undefined, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyPerformanceMode
You can execute the `SelectMyPerformanceMode` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyPerformanceMode(options?: useDataConnectMutationOptions<SelectMyPerformanceModeData, FirebaseError, SelectMyPerformanceModeVariables>): UseDataConnectMutationResult<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyPerformanceMode(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyPerformanceModeData, FirebaseError, SelectMyPerformanceModeVariables>): UseDataConnectMutationResult<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;
```

### Variables
The `SelectMyPerformanceMode` Mutation requires an argument of type `SelectMyPerformanceModeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyPerformanceModeVariables {
  performanceMode: boolean;
}
```
### Return Type
Recall that calling the `SelectMyPerformanceMode` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyPerformanceMode` Mutation is of type `SelectMyPerformanceModeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyPerformanceModeData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyPerformanceMode`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyPerformanceModeVariables } from '@financeconnect/generated';
import { useSelectMyPerformanceMode } from '@financeconnect/generated/react'

export default function SelectMyPerformanceModeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyPerformanceMode();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyPerformanceMode(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyPerformanceMode(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyPerformanceMode(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyPerformanceMode` Mutation requires an argument of type `SelectMyPerformanceModeVariables`:
  const selectMyPerformanceModeVars: SelectMyPerformanceModeVariables = {
    performanceMode: ..., 
  };
  mutation.mutate(selectMyPerformanceModeVars);
  // Variables can be defined inline as well.
  mutation.mutate({ performanceMode: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyPerformanceModeVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyBackgroundOpacity
You can execute the `SelectMyBackgroundOpacity` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyBackgroundOpacity(options?: useDataConnectMutationOptions<SelectMyBackgroundOpacityData, FirebaseError, SelectMyBackgroundOpacityVariables>): UseDataConnectMutationResult<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyBackgroundOpacity(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyBackgroundOpacityData, FirebaseError, SelectMyBackgroundOpacityVariables>): UseDataConnectMutationResult<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;
```

### Variables
The `SelectMyBackgroundOpacity` Mutation requires an argument of type `SelectMyBackgroundOpacityVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyBackgroundOpacityVariables {
  backgroundOpacity: number;
}
```
### Return Type
Recall that calling the `SelectMyBackgroundOpacity` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyBackgroundOpacity` Mutation is of type `SelectMyBackgroundOpacityData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyBackgroundOpacityData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyBackgroundOpacity`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyBackgroundOpacityVariables } from '@financeconnect/generated';
import { useSelectMyBackgroundOpacity } from '@financeconnect/generated/react'

export default function SelectMyBackgroundOpacityComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyBackgroundOpacity();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyBackgroundOpacity(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyBackgroundOpacity(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyBackgroundOpacity(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyBackgroundOpacity` Mutation requires an argument of type `SelectMyBackgroundOpacityVariables`:
  const selectMyBackgroundOpacityVars: SelectMyBackgroundOpacityVariables = {
    backgroundOpacity: ..., 
  };
  mutation.mutate(selectMyBackgroundOpacityVars);
  // Variables can be defined inline as well.
  mutation.mutate({ backgroundOpacity: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyBackgroundOpacityVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyExternalAccountLinkTemplate
You can execute the `SelectMyExternalAccountLinkTemplate` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyExternalAccountLinkTemplate(options?: useDataConnectMutationOptions<SelectMyExternalAccountLinkTemplateData, FirebaseError, SelectMyExternalAccountLinkTemplateVariables | void>): UseDataConnectMutationResult<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyExternalAccountLinkTemplate(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyExternalAccountLinkTemplateData, FirebaseError, SelectMyExternalAccountLinkTemplateVariables | void>): UseDataConnectMutationResult<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;
```

### Variables
The `SelectMyExternalAccountLinkTemplate` Mutation has an optional argument of type `SelectMyExternalAccountLinkTemplateVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyExternalAccountLinkTemplateVariables {
  externalAccountLinkTemplate?: string | null;
}
```
### Return Type
Recall that calling the `SelectMyExternalAccountLinkTemplate` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyExternalAccountLinkTemplate` Mutation is of type `SelectMyExternalAccountLinkTemplateData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyExternalAccountLinkTemplateData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyExternalAccountLinkTemplate`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyExternalAccountLinkTemplateVariables } from '@financeconnect/generated';
import { useSelectMyExternalAccountLinkTemplate } from '@financeconnect/generated/react'

export default function SelectMyExternalAccountLinkTemplateComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyExternalAccountLinkTemplate();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyExternalAccountLinkTemplate(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyExternalAccountLinkTemplate(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyExternalAccountLinkTemplate(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyExternalAccountLinkTemplate` Mutation has an optional argument of type `SelectMyExternalAccountLinkTemplateVariables`:
  const selectMyExternalAccountLinkTemplateVars: SelectMyExternalAccountLinkTemplateVariables = {
    externalAccountLinkTemplate: ..., // optional
  };
  mutation.mutate(selectMyExternalAccountLinkTemplateVars);
  // Variables can be defined inline as well.
  mutation.mutate({ externalAccountLinkTemplate: ..., });
  // Since all variables are optional for this Mutation, you can omit the `SelectMyExternalAccountLinkTemplateVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyExternalAccountLinkTemplateVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyCardStyle
You can execute the `SelectMyCardStyle` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyCardStyle(options?: useDataConnectMutationOptions<SelectMyCardStyleData, FirebaseError, SelectMyCardStyleVariables>): UseDataConnectMutationResult<SelectMyCardStyleData, SelectMyCardStyleVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyCardStyle(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyCardStyleData, FirebaseError, SelectMyCardStyleVariables>): UseDataConnectMutationResult<SelectMyCardStyleData, SelectMyCardStyleVariables>;
```

### Variables
The `SelectMyCardStyle` Mutation requires an argument of type `SelectMyCardStyleVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyCardStyleVariables {
  cardOpacity: number;
  cardBlur: number;
}
```
### Return Type
Recall that calling the `SelectMyCardStyle` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyCardStyle` Mutation is of type `SelectMyCardStyleData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyCardStyleData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyCardStyle`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyCardStyleVariables } from '@financeconnect/generated';
import { useSelectMyCardStyle } from '@financeconnect/generated/react'

export default function SelectMyCardStyleComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyCardStyle();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyCardStyle(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyCardStyle(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyCardStyle(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyCardStyle` Mutation requires an argument of type `SelectMyCardStyleVariables`:
  const selectMyCardStyleVars: SelectMyCardStyleVariables = {
    cardOpacity: ..., 
    cardBlur: ..., 
  };
  mutation.mutate(selectMyCardStyleVars);
  // Variables can be defined inline as well.
  mutation.mutate({ cardOpacity: ..., cardBlur: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyCardStyleVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMySquareCorners
You can execute the `SelectMySquareCorners` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMySquareCorners(options?: useDataConnectMutationOptions<SelectMySquareCornersData, FirebaseError, SelectMySquareCornersVariables>): UseDataConnectMutationResult<SelectMySquareCornersData, SelectMySquareCornersVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMySquareCorners(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMySquareCornersData, FirebaseError, SelectMySquareCornersVariables>): UseDataConnectMutationResult<SelectMySquareCornersData, SelectMySquareCornersVariables>;
```

### Variables
The `SelectMySquareCorners` Mutation requires an argument of type `SelectMySquareCornersVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMySquareCornersVariables {
  squareCorners: boolean;
}
```
### Return Type
Recall that calling the `SelectMySquareCorners` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMySquareCorners` Mutation is of type `SelectMySquareCornersData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMySquareCornersData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMySquareCorners`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMySquareCornersVariables } from '@financeconnect/generated';
import { useSelectMySquareCorners } from '@financeconnect/generated/react'

export default function SelectMySquareCornersComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMySquareCorners();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMySquareCorners(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMySquareCorners(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMySquareCorners(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMySquareCorners` Mutation requires an argument of type `SelectMySquareCornersVariables`:
  const selectMySquareCornersVars: SelectMySquareCornersVariables = {
    squareCorners: ..., 
  };
  mutation.mutate(selectMySquareCornersVars);
  // Variables can be defined inline as well.
  mutation.mutate({ squareCorners: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMySquareCornersVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyBordersEnabled
You can execute the `SelectMyBordersEnabled` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyBordersEnabled(options?: useDataConnectMutationOptions<SelectMyBordersEnabledData, FirebaseError, SelectMyBordersEnabledVariables>): UseDataConnectMutationResult<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyBordersEnabled(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyBordersEnabledData, FirebaseError, SelectMyBordersEnabledVariables>): UseDataConnectMutationResult<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;
```

### Variables
The `SelectMyBordersEnabled` Mutation requires an argument of type `SelectMyBordersEnabledVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyBordersEnabledVariables {
  bordersEnabled: boolean;
}
```
### Return Type
Recall that calling the `SelectMyBordersEnabled` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyBordersEnabled` Mutation is of type `SelectMyBordersEnabledData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyBordersEnabledData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyBordersEnabled`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyBordersEnabledVariables } from '@financeconnect/generated';
import { useSelectMyBordersEnabled } from '@financeconnect/generated/react'

export default function SelectMyBordersEnabledComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyBordersEnabled();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyBordersEnabled(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyBordersEnabled(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyBordersEnabled(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyBordersEnabled` Mutation requires an argument of type `SelectMyBordersEnabledVariables`:
  const selectMyBordersEnabledVars: SelectMyBordersEnabledVariables = {
    bordersEnabled: ..., 
  };
  mutation.mutate(selectMyBordersEnabledVars);
  // Variables can be defined inline as well.
  mutation.mutate({ bordersEnabled: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyBordersEnabledVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyCategoryColorsEnabled
You can execute the `SelectMyCategoryColorsEnabled` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyCategoryColorsEnabled(options?: useDataConnectMutationOptions<SelectMyCategoryColorsEnabledData, FirebaseError, SelectMyCategoryColorsEnabledVariables>): UseDataConnectMutationResult<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyCategoryColorsEnabled(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyCategoryColorsEnabledData, FirebaseError, SelectMyCategoryColorsEnabledVariables>): UseDataConnectMutationResult<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;
```

### Variables
The `SelectMyCategoryColorsEnabled` Mutation requires an argument of type `SelectMyCategoryColorsEnabledVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyCategoryColorsEnabledVariables {
  categoryColorsEnabled: boolean;
}
```
### Return Type
Recall that calling the `SelectMyCategoryColorsEnabled` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyCategoryColorsEnabled` Mutation is of type `SelectMyCategoryColorsEnabledData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyCategoryColorsEnabledData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyCategoryColorsEnabled`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyCategoryColorsEnabledVariables } from '@financeconnect/generated';
import { useSelectMyCategoryColorsEnabled } from '@financeconnect/generated/react'

export default function SelectMyCategoryColorsEnabledComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyCategoryColorsEnabled();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyCategoryColorsEnabled(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyCategoryColorsEnabled(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyCategoryColorsEnabled(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyCategoryColorsEnabled` Mutation requires an argument of type `SelectMyCategoryColorsEnabledVariables`:
  const selectMyCategoryColorsEnabledVars: SelectMyCategoryColorsEnabledVariables = {
    categoryColorsEnabled: ..., 
  };
  mutation.mutate(selectMyCategoryColorsEnabledVars);
  // Variables can be defined inline as well.
  mutation.mutate({ categoryColorsEnabled: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyCategoryColorsEnabledVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SelectMyCurrency
You can execute the `SelectMyCurrency` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useSelectMyCurrency(options?: useDataConnectMutationOptions<SelectMyCurrencyData, FirebaseError, SelectMyCurrencyVariables>): UseDataConnectMutationResult<SelectMyCurrencyData, SelectMyCurrencyVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useSelectMyCurrency(dc: DataConnect, options?: useDataConnectMutationOptions<SelectMyCurrencyData, FirebaseError, SelectMyCurrencyVariables>): UseDataConnectMutationResult<SelectMyCurrencyData, SelectMyCurrencyVariables>;
```

### Variables
The `SelectMyCurrency` Mutation requires an argument of type `SelectMyCurrencyVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SelectMyCurrencyVariables {
  currencyCode: string;
}
```
### Return Type
Recall that calling the `SelectMyCurrency` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `SelectMyCurrency` Mutation is of type `SelectMyCurrencyData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface SelectMyCurrencyData {
  userSetting_update?: UserSetting_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `SelectMyCurrency`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SelectMyCurrencyVariables } from '@financeconnect/generated';
import { useSelectMyCurrency } from '@financeconnect/generated/react'

export default function SelectMyCurrencyComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useSelectMyCurrency();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useSelectMyCurrency(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyCurrency(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useSelectMyCurrency(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useSelectMyCurrency` Mutation requires an argument of type `SelectMyCurrencyVariables`:
  const selectMyCurrencyVars: SelectMyCurrencyVariables = {
    currencyCode: ..., 
  };
  mutation.mutate(selectMyCurrencyVars);
  // Variables can be defined inline as well.
  mutation.mutate({ currencyCode: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(selectMyCurrencyVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateFamilyMember
You can execute the `CreateFamilyMember` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateFamilyMember(options?: useDataConnectMutationOptions<CreateFamilyMemberData, FirebaseError, CreateFamilyMemberVariables>): UseDataConnectMutationResult<CreateFamilyMemberData, CreateFamilyMemberVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateFamilyMember(dc: DataConnect, options?: useDataConnectMutationOptions<CreateFamilyMemberData, FirebaseError, CreateFamilyMemberVariables>): UseDataConnectMutationResult<CreateFamilyMemberData, CreateFamilyMemberVariables>;
```

### Variables
The `CreateFamilyMember` Mutation requires an argument of type `CreateFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateFamilyMemberVariables {
  userId: UUIDString;
  familyMemberId: UUIDString;
  name: string;
  relationship?: string | null;
  color?: string | null;
  monthlyIncomeTargetMinor?: number | null;
}
```
### Return Type
Recall that calling the `CreateFamilyMember` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateFamilyMember` Mutation is of type `CreateFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateFamilyMemberData {
  familyMember_insert: FamilyMember_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateFamilyMember`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateFamilyMemberVariables } from '@financeconnect/generated';
import { useCreateFamilyMember } from '@financeconnect/generated/react'

export default function CreateFamilyMemberComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateFamilyMember();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateFamilyMember(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateFamilyMember(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateFamilyMember(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateFamilyMember` Mutation requires an argument of type `CreateFamilyMemberVariables`:
  const createFamilyMemberVars: CreateFamilyMemberVariables = {
    userId: ..., 
    familyMemberId: ..., 
    name: ..., 
    relationship: ..., // optional
    color: ..., // optional
    monthlyIncomeTargetMinor: ..., // optional
  };
  mutation.mutate(createFamilyMemberVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., familyMemberId: ..., name: ..., relationship: ..., color: ..., monthlyIncomeTargetMinor: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createFamilyMemberVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyMember_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateFamilyMember
You can execute the `UpdateFamilyMember` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateFamilyMember(options?: useDataConnectMutationOptions<UpdateFamilyMemberData, FirebaseError, UpdateFamilyMemberVariables>): UseDataConnectMutationResult<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateFamilyMember(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateFamilyMemberData, FirebaseError, UpdateFamilyMemberVariables>): UseDataConnectMutationResult<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;
```

### Variables
The `UpdateFamilyMember` Mutation requires an argument of type `UpdateFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateFamilyMemberVariables {
  familyMemberId: UUIDString;
  name: string;
  relationship?: string | null;
  color?: string | null;
  externalAccountRef?: string | null;
  monthlyIncomeTargetMinor?: number | null;
}
```
### Return Type
Recall that calling the `UpdateFamilyMember` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateFamilyMember` Mutation is of type `UpdateFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateFamilyMember`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateFamilyMemberVariables } from '@financeconnect/generated';
import { useUpdateFamilyMember } from '@financeconnect/generated/react'

export default function UpdateFamilyMemberComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateFamilyMember();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateFamilyMember(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateFamilyMember(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateFamilyMember(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateFamilyMember` Mutation requires an argument of type `UpdateFamilyMemberVariables`:
  const updateFamilyMemberVars: UpdateFamilyMemberVariables = {
    familyMemberId: ..., 
    name: ..., 
    relationship: ..., // optional
    color: ..., // optional
    externalAccountRef: ..., // optional
    monthlyIncomeTargetMinor: ..., // optional
  };
  mutation.mutate(updateFamilyMemberVars);
  // Variables can be defined inline as well.
  mutation.mutate({ familyMemberId: ..., name: ..., relationship: ..., color: ..., externalAccountRef: ..., monthlyIncomeTargetMinor: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateFamilyMemberVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyMember_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RenameFamilyMember
You can execute the `RenameFamilyMember` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRenameFamilyMember(options?: useDataConnectMutationOptions<RenameFamilyMemberData, FirebaseError, RenameFamilyMemberVariables>): UseDataConnectMutationResult<RenameFamilyMemberData, RenameFamilyMemberVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRenameFamilyMember(dc: DataConnect, options?: useDataConnectMutationOptions<RenameFamilyMemberData, FirebaseError, RenameFamilyMemberVariables>): UseDataConnectMutationResult<RenameFamilyMemberData, RenameFamilyMemberVariables>;
```

### Variables
The `RenameFamilyMember` Mutation requires an argument of type `RenameFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RenameFamilyMemberVariables {
  familyMemberId: UUIDString;
  name: string;
}
```
### Return Type
Recall that calling the `RenameFamilyMember` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RenameFamilyMember` Mutation is of type `RenameFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RenameFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RenameFamilyMember`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RenameFamilyMemberVariables } from '@financeconnect/generated';
import { useRenameFamilyMember } from '@financeconnect/generated/react'

export default function RenameFamilyMemberComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRenameFamilyMember();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRenameFamilyMember(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRenameFamilyMember(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRenameFamilyMember(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRenameFamilyMember` Mutation requires an argument of type `RenameFamilyMemberVariables`:
  const renameFamilyMemberVars: RenameFamilyMemberVariables = {
    familyMemberId: ..., 
    name: ..., 
  };
  mutation.mutate(renameFamilyMemberVars);
  // Variables can be defined inline as well.
  mutation.mutate({ familyMemberId: ..., name: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(renameFamilyMemberVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyMember_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteFamilyMember
You can execute the `DeleteFamilyMember` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteFamilyMember(options?: useDataConnectMutationOptions<DeleteFamilyMemberData, FirebaseError, DeleteFamilyMemberVariables>): UseDataConnectMutationResult<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteFamilyMember(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteFamilyMemberData, FirebaseError, DeleteFamilyMemberVariables>): UseDataConnectMutationResult<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;
```

### Variables
The `DeleteFamilyMember` Mutation requires an argument of type `DeleteFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteFamilyMemberVariables {
  familyMemberId: UUIDString;
}
```
### Return Type
Recall that calling the `DeleteFamilyMember` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteFamilyMember` Mutation is of type `DeleteFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteFamilyMember`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteFamilyMemberVariables } from '@financeconnect/generated';
import { useDeleteFamilyMember } from '@financeconnect/generated/react'

export default function DeleteFamilyMemberComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteFamilyMember();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteFamilyMember(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteFamilyMember(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteFamilyMember(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteFamilyMember` Mutation requires an argument of type `DeleteFamilyMemberVariables`:
  const deleteFamilyMemberVars: DeleteFamilyMemberVariables = {
    familyMemberId: ..., 
  };
  mutation.mutate(deleteFamilyMemberVars);
  // Variables can be defined inline as well.
  mutation.mutate({ familyMemberId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteFamilyMemberVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyMember_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertCategory
You can execute the `UpsertCategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertCategory(options?: useDataConnectMutationOptions<UpsertCategoryData, FirebaseError, UpsertCategoryVariables>): UseDataConnectMutationResult<UpsertCategoryData, UpsertCategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertCategory(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertCategoryData, FirebaseError, UpsertCategoryVariables>): UseDataConnectMutationResult<UpsertCategoryData, UpsertCategoryVariables>;
```

### Variables
The `UpsertCategory` Mutation requires an argument of type `UpsertCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertCategoryVariables {
  name: string;
  kind?: string;
  parentGroup?: string | null;
  color?: string | null;
}
```
### Return Type
Recall that calling the `UpsertCategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertCategory` Mutation is of type `UpsertCategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertCategoryData {
  category_upsert: Category_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertCategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertCategoryVariables } from '@financeconnect/generated';
import { useUpsertCategory } from '@financeconnect/generated/react'

export default function UpsertCategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertCategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertCategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertCategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertCategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertCategory` Mutation requires an argument of type `UpsertCategoryVariables`:
  const upsertCategoryVars: UpsertCategoryVariables = {
    name: ..., 
    kind: ..., // optional
    parentGroup: ..., // optional
    color: ..., // optional
  };
  mutation.mutate(upsertCategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ name: ..., kind: ..., parentGroup: ..., color: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertCategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.category_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateCategory
You can execute the `UpdateCategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateCategory(options?: useDataConnectMutationOptions<UpdateCategoryData, FirebaseError, UpdateCategoryVariables>): UseDataConnectMutationResult<UpdateCategoryData, UpdateCategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateCategory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateCategoryData, FirebaseError, UpdateCategoryVariables>): UseDataConnectMutationResult<UpdateCategoryData, UpdateCategoryVariables>;
```

### Variables
The `UpdateCategory` Mutation requires an argument of type `UpdateCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateCategoryVariables {
  name: string;
  kind: string;
  parentGroup?: string | null;
  color?: string | null;
}
```
### Return Type
Recall that calling the `UpdateCategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateCategory` Mutation is of type `UpdateCategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateCategoryData {
  category_update?: Category_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateCategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateCategoryVariables } from '@financeconnect/generated';
import { useUpdateCategory } from '@financeconnect/generated/react'

export default function UpdateCategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateCategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateCategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateCategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateCategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateCategory` Mutation requires an argument of type `UpdateCategoryVariables`:
  const updateCategoryVars: UpdateCategoryVariables = {
    name: ..., 
    kind: ..., 
    parentGroup: ..., // optional
    color: ..., // optional
  };
  mutation.mutate(updateCategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ name: ..., kind: ..., parentGroup: ..., color: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateCategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.category_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateTransaction
You can execute the `CreateTransaction` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateTransaction(options?: useDataConnectMutationOptions<CreateTransactionData, FirebaseError, CreateTransactionVariables>): UseDataConnectMutationResult<CreateTransactionData, CreateTransactionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateTransaction(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTransactionData, FirebaseError, CreateTransactionVariables>): UseDataConnectMutationResult<CreateTransactionData, CreateTransactionVariables>;
```

### Variables
The `CreateTransaction` Mutation requires an argument of type `CreateTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateTransactionVariables {
  userId: UUIDString;
  familyMemberId: UUIDString;
  amountMinor: number;
  direction: string;
  occurredOn: DateString;
  createdAt: TimestampString;
  description?: string | null;
  merchant?: string | null;
  method?: string | null;
  recurrence?: string | null;
  categoryName?: string | null;
  source?: string | null;
  status?: string | null;
}
```
### Return Type
Recall that calling the `CreateTransaction` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateTransaction` Mutation is of type `CreateTransactionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateTransactionData {
  transaction_insert: Transaction_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateTransaction`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateTransactionVariables } from '@financeconnect/generated';
import { useCreateTransaction } from '@financeconnect/generated/react'

export default function CreateTransactionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateTransaction();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateTransaction(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateTransaction(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateTransaction(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateTransaction` Mutation requires an argument of type `CreateTransactionVariables`:
  const createTransactionVars: CreateTransactionVariables = {
    userId: ..., 
    familyMemberId: ..., 
    amountMinor: ..., 
    direction: ..., 
    occurredOn: ..., 
    createdAt: ..., 
    description: ..., // optional
    merchant: ..., // optional
    method: ..., // optional
    recurrence: ..., // optional
    categoryName: ..., // optional
    source: ..., // optional
    status: ..., // optional
  };
  mutation.mutate(createTransactionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., familyMemberId: ..., amountMinor: ..., direction: ..., occurredOn: ..., createdAt: ..., description: ..., merchant: ..., method: ..., recurrence: ..., categoryName: ..., source: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createTransactionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.transaction_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateTransaction
You can execute the `UpdateTransaction` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateTransaction(options?: useDataConnectMutationOptions<UpdateTransactionData, FirebaseError, UpdateTransactionVariables>): UseDataConnectMutationResult<UpdateTransactionData, UpdateTransactionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateTransaction(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateTransactionData, FirebaseError, UpdateTransactionVariables>): UseDataConnectMutationResult<UpdateTransactionData, UpdateTransactionVariables>;
```

### Variables
The `UpdateTransaction` Mutation requires an argument of type `UpdateTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateTransactionVariables {
  transactionId: UUIDString;
  amountMinor: number;
  direction: string;
  occurredOn: DateString;
  description?: string | null;
  merchant?: string | null;
  method?: string | null;
  recurrence?: string | null;
  categoryName?: string | null;
  source?: string | null;
  status?: string | null;
}
```
### Return Type
Recall that calling the `UpdateTransaction` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateTransaction` Mutation is of type `UpdateTransactionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateTransactionData {
  transaction_update?: Transaction_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateTransaction`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateTransactionVariables } from '@financeconnect/generated';
import { useUpdateTransaction } from '@financeconnect/generated/react'

export default function UpdateTransactionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateTransaction();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateTransaction(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateTransaction(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateTransaction(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateTransaction` Mutation requires an argument of type `UpdateTransactionVariables`:
  const updateTransactionVars: UpdateTransactionVariables = {
    transactionId: ..., 
    amountMinor: ..., 
    direction: ..., 
    occurredOn: ..., 
    description: ..., // optional
    merchant: ..., // optional
    method: ..., // optional
    recurrence: ..., // optional
    categoryName: ..., // optional
    source: ..., // optional
    status: ..., // optional
  };
  mutation.mutate(updateTransactionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ transactionId: ..., amountMinor: ..., direction: ..., occurredOn: ..., description: ..., merchant: ..., method: ..., recurrence: ..., categoryName: ..., source: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateTransactionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.transaction_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpdateTransactionClearCategory
You can execute the `UpdateTransactionClearCategory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpdateTransactionClearCategory(options?: useDataConnectMutationOptions<UpdateTransactionClearCategoryData, FirebaseError, UpdateTransactionClearCategoryVariables>): UseDataConnectMutationResult<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpdateTransactionClearCategory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateTransactionClearCategoryData, FirebaseError, UpdateTransactionClearCategoryVariables>): UseDataConnectMutationResult<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;
```

### Variables
The `UpdateTransactionClearCategory` Mutation requires an argument of type `UpdateTransactionClearCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpdateTransactionClearCategoryVariables {
  transactionId: UUIDString;
  amountMinor: number;
  direction: string;
  occurredOn: DateString;
  description?: string | null;
  merchant?: string | null;
  method?: string | null;
  recurrence?: string | null;
  source?: string | null;
  status?: string | null;
}
```
### Return Type
Recall that calling the `UpdateTransactionClearCategory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpdateTransactionClearCategory` Mutation is of type `UpdateTransactionClearCategoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpdateTransactionClearCategoryData {
  transaction_update?: Transaction_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpdateTransactionClearCategory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpdateTransactionClearCategoryVariables } from '@financeconnect/generated';
import { useUpdateTransactionClearCategory } from '@financeconnect/generated/react'

export default function UpdateTransactionClearCategoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpdateTransactionClearCategory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpdateTransactionClearCategory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateTransactionClearCategory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpdateTransactionClearCategory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpdateTransactionClearCategory` Mutation requires an argument of type `UpdateTransactionClearCategoryVariables`:
  const updateTransactionClearCategoryVars: UpdateTransactionClearCategoryVariables = {
    transactionId: ..., 
    amountMinor: ..., 
    direction: ..., 
    occurredOn: ..., 
    description: ..., // optional
    merchant: ..., // optional
    method: ..., // optional
    recurrence: ..., // optional
    source: ..., // optional
    status: ..., // optional
  };
  mutation.mutate(updateTransactionClearCategoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ transactionId: ..., amountMinor: ..., direction: ..., occurredOn: ..., description: ..., merchant: ..., method: ..., recurrence: ..., source: ..., status: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(updateTransactionClearCategoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.transaction_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## MarkTransactionPosted
You can execute the `MarkTransactionPosted` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useMarkTransactionPosted(options?: useDataConnectMutationOptions<MarkTransactionPostedData, FirebaseError, MarkTransactionPostedVariables>): UseDataConnectMutationResult<MarkTransactionPostedData, MarkTransactionPostedVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useMarkTransactionPosted(dc: DataConnect, options?: useDataConnectMutationOptions<MarkTransactionPostedData, FirebaseError, MarkTransactionPostedVariables>): UseDataConnectMutationResult<MarkTransactionPostedData, MarkTransactionPostedVariables>;
```

### Variables
The `MarkTransactionPosted` Mutation requires an argument of type `MarkTransactionPostedVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface MarkTransactionPostedVariables {
  transactionId: UUIDString;
}
```
### Return Type
Recall that calling the `MarkTransactionPosted` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `MarkTransactionPosted` Mutation is of type `MarkTransactionPostedData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface MarkTransactionPostedData {
  transaction_update?: Transaction_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `MarkTransactionPosted`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, MarkTransactionPostedVariables } from '@financeconnect/generated';
import { useMarkTransactionPosted } from '@financeconnect/generated/react'

export default function MarkTransactionPostedComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useMarkTransactionPosted();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useMarkTransactionPosted(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkTransactionPosted(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkTransactionPosted(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useMarkTransactionPosted` Mutation requires an argument of type `MarkTransactionPostedVariables`:
  const markTransactionPostedVars: MarkTransactionPostedVariables = {
    transactionId: ..., 
  };
  mutation.mutate(markTransactionPostedVars);
  // Variables can be defined inline as well.
  mutation.mutate({ transactionId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(markTransactionPostedVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.transaction_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## MarkTransactionProjected
You can execute the `MarkTransactionProjected` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useMarkTransactionProjected(options?: useDataConnectMutationOptions<MarkTransactionProjectedData, FirebaseError, MarkTransactionProjectedVariables>): UseDataConnectMutationResult<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useMarkTransactionProjected(dc: DataConnect, options?: useDataConnectMutationOptions<MarkTransactionProjectedData, FirebaseError, MarkTransactionProjectedVariables>): UseDataConnectMutationResult<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;
```

### Variables
The `MarkTransactionProjected` Mutation requires an argument of type `MarkTransactionProjectedVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface MarkTransactionProjectedVariables {
  transactionId: UUIDString;
}
```
### Return Type
Recall that calling the `MarkTransactionProjected` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `MarkTransactionProjected` Mutation is of type `MarkTransactionProjectedData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface MarkTransactionProjectedData {
  transaction_update?: Transaction_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `MarkTransactionProjected`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, MarkTransactionProjectedVariables } from '@financeconnect/generated';
import { useMarkTransactionProjected } from '@financeconnect/generated/react'

export default function MarkTransactionProjectedComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useMarkTransactionProjected();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useMarkTransactionProjected(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkTransactionProjected(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkTransactionProjected(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useMarkTransactionProjected` Mutation requires an argument of type `MarkTransactionProjectedVariables`:
  const markTransactionProjectedVars: MarkTransactionProjectedVariables = {
    transactionId: ..., 
  };
  mutation.mutate(markTransactionProjectedVars);
  // Variables can be defined inline as well.
  mutation.mutate({ transactionId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(markTransactionProjectedVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.transaction_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteTransaction
You can execute the `DeleteTransaction` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteTransaction(options?: useDataConnectMutationOptions<DeleteTransactionData, FirebaseError, DeleteTransactionVariables>): UseDataConnectMutationResult<DeleteTransactionData, DeleteTransactionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteTransaction(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteTransactionData, FirebaseError, DeleteTransactionVariables>): UseDataConnectMutationResult<DeleteTransactionData, DeleteTransactionVariables>;
```

### Variables
The `DeleteTransaction` Mutation requires an argument of type `DeleteTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteTransactionVariables {
  transactionId: UUIDString;
}
```
### Return Type
Recall that calling the `DeleteTransaction` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteTransaction` Mutation is of type `DeleteTransactionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteTransactionData {
  transaction_delete?: Transaction_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteTransaction`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteTransactionVariables } from '@financeconnect/generated';
import { useDeleteTransaction } from '@financeconnect/generated/react'

export default function DeleteTransactionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteTransaction();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteTransaction(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteTransaction(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteTransaction(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteTransaction` Mutation requires an argument of type `DeleteTransactionVariables`:
  const deleteTransactionVars: DeleteTransactionVariables = {
    transactionId: ..., 
  };
  mutation.mutate(deleteTransactionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ transactionId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteTransactionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.transaction_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateFamily
You can execute the `CreateFamily` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateFamily(options?: useDataConnectMutationOptions<CreateFamilyData, FirebaseError, CreateFamilyVariables>): UseDataConnectMutationResult<CreateFamilyData, CreateFamilyVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateFamily(dc: DataConnect, options?: useDataConnectMutationOptions<CreateFamilyData, FirebaseError, CreateFamilyVariables>): UseDataConnectMutationResult<CreateFamilyData, CreateFamilyVariables>;
```

### Variables
The `CreateFamily` Mutation requires an argument of type `CreateFamilyVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateFamilyVariables {
  userId: UUIDString;
  familyId: UUIDString;
  name: string;
  inviteCode: string;
}
```
### Return Type
Recall that calling the `CreateFamily` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateFamily` Mutation is of type `CreateFamilyData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateFamilyData {
  family_insert: Family_Key;
  user_update?: User_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateFamily`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateFamilyVariables } from '@financeconnect/generated';
import { useCreateFamily } from '@financeconnect/generated/react'

export default function CreateFamilyComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateFamily();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateFamily(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateFamily(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateFamily(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateFamily` Mutation requires an argument of type `CreateFamilyVariables`:
  const createFamilyVars: CreateFamilyVariables = {
    userId: ..., 
    familyId: ..., 
    name: ..., 
    inviteCode: ..., 
  };
  mutation.mutate(createFamilyVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., familyId: ..., name: ..., inviteCode: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createFamilyVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.family_insert);
    console.log(mutation.data.user_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RequestToJoinFamily
You can execute the `RequestToJoinFamily` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRequestToJoinFamily(options?: useDataConnectMutationOptions<RequestToJoinFamilyData, FirebaseError, RequestToJoinFamilyVariables>): UseDataConnectMutationResult<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRequestToJoinFamily(dc: DataConnect, options?: useDataConnectMutationOptions<RequestToJoinFamilyData, FirebaseError, RequestToJoinFamilyVariables>): UseDataConnectMutationResult<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;
```

### Variables
The `RequestToJoinFamily` Mutation requires an argument of type `RequestToJoinFamilyVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RequestToJoinFamilyVariables {
  userId: UUIDString;
  familyId: UUIDString;
}
```
### Return Type
Recall that calling the `RequestToJoinFamily` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RequestToJoinFamily` Mutation is of type `RequestToJoinFamilyData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RequestToJoinFamilyData {
  familyJoinRequest_upsert: FamilyJoinRequest_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RequestToJoinFamily`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RequestToJoinFamilyVariables } from '@financeconnect/generated';
import { useRequestToJoinFamily } from '@financeconnect/generated/react'

export default function RequestToJoinFamilyComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRequestToJoinFamily();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRequestToJoinFamily(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRequestToJoinFamily(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRequestToJoinFamily(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRequestToJoinFamily` Mutation requires an argument of type `RequestToJoinFamilyVariables`:
  const requestToJoinFamilyVars: RequestToJoinFamilyVariables = {
    userId: ..., 
    familyId: ..., 
  };
  mutation.mutate(requestToJoinFamilyVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., familyId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(requestToJoinFamilyVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyJoinRequest_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ApproveJoinRequest
You can execute the `ApproveJoinRequest` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useApproveJoinRequest(options?: useDataConnectMutationOptions<ApproveJoinRequestData, FirebaseError, ApproveJoinRequestVariables>): UseDataConnectMutationResult<ApproveJoinRequestData, ApproveJoinRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useApproveJoinRequest(dc: DataConnect, options?: useDataConnectMutationOptions<ApproveJoinRequestData, FirebaseError, ApproveJoinRequestVariables>): UseDataConnectMutationResult<ApproveJoinRequestData, ApproveJoinRequestVariables>;
```

### Variables
The `ApproveJoinRequest` Mutation requires an argument of type `ApproveJoinRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ApproveJoinRequestVariables {
  familyId: UUIDString;
  requesterId: UUIDString;
}
```
### Return Type
Recall that calling the `ApproveJoinRequest` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `ApproveJoinRequest` Mutation is of type `ApproveJoinRequestData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ApproveJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
  user_update?: User_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `ApproveJoinRequest`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ApproveJoinRequestVariables } from '@financeconnect/generated';
import { useApproveJoinRequest } from '@financeconnect/generated/react'

export default function ApproveJoinRequestComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useApproveJoinRequest();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useApproveJoinRequest(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useApproveJoinRequest(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useApproveJoinRequest(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useApproveJoinRequest` Mutation requires an argument of type `ApproveJoinRequestVariables`:
  const approveJoinRequestVars: ApproveJoinRequestVariables = {
    familyId: ..., 
    requesterId: ..., 
  };
  mutation.mutate(approveJoinRequestVars);
  // Variables can be defined inline as well.
  mutation.mutate({ familyId: ..., requesterId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(approveJoinRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyJoinRequest_update);
    console.log(mutation.data.user_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DenyJoinRequest
You can execute the `DenyJoinRequest` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDenyJoinRequest(options?: useDataConnectMutationOptions<DenyJoinRequestData, FirebaseError, DenyJoinRequestVariables>): UseDataConnectMutationResult<DenyJoinRequestData, DenyJoinRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDenyJoinRequest(dc: DataConnect, options?: useDataConnectMutationOptions<DenyJoinRequestData, FirebaseError, DenyJoinRequestVariables>): UseDataConnectMutationResult<DenyJoinRequestData, DenyJoinRequestVariables>;
```

### Variables
The `DenyJoinRequest` Mutation requires an argument of type `DenyJoinRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DenyJoinRequestVariables {
  familyId: UUIDString;
  requesterId: UUIDString;
}
```
### Return Type
Recall that calling the `DenyJoinRequest` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DenyJoinRequest` Mutation is of type `DenyJoinRequestData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DenyJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DenyJoinRequest`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DenyJoinRequestVariables } from '@financeconnect/generated';
import { useDenyJoinRequest } from '@financeconnect/generated/react'

export default function DenyJoinRequestComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDenyJoinRequest();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDenyJoinRequest(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDenyJoinRequest(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDenyJoinRequest(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDenyJoinRequest` Mutation requires an argument of type `DenyJoinRequestVariables`:
  const denyJoinRequestVars: DenyJoinRequestVariables = {
    familyId: ..., 
    requesterId: ..., 
  };
  mutation.mutate(denyJoinRequestVars);
  // Variables can be defined inline as well.
  mutation.mutate({ familyId: ..., requesterId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(denyJoinRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyJoinRequest_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CancelMyJoinRequest
You can execute the `CancelMyJoinRequest` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCancelMyJoinRequest(options?: useDataConnectMutationOptions<CancelMyJoinRequestData, FirebaseError, CancelMyJoinRequestVariables>): UseDataConnectMutationResult<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCancelMyJoinRequest(dc: DataConnect, options?: useDataConnectMutationOptions<CancelMyJoinRequestData, FirebaseError, CancelMyJoinRequestVariables>): UseDataConnectMutationResult<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;
```

### Variables
The `CancelMyJoinRequest` Mutation requires an argument of type `CancelMyJoinRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CancelMyJoinRequestVariables {
  familyId: UUIDString;
  userId: UUIDString;
}
```
### Return Type
Recall that calling the `CancelMyJoinRequest` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CancelMyJoinRequest` Mutation is of type `CancelMyJoinRequestData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CancelMyJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CancelMyJoinRequest`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CancelMyJoinRequestVariables } from '@financeconnect/generated';
import { useCancelMyJoinRequest } from '@financeconnect/generated/react'

export default function CancelMyJoinRequestComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCancelMyJoinRequest();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCancelMyJoinRequest(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCancelMyJoinRequest(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCancelMyJoinRequest(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCancelMyJoinRequest` Mutation requires an argument of type `CancelMyJoinRequestVariables`:
  const cancelMyJoinRequestVars: CancelMyJoinRequestVariables = {
    familyId: ..., 
    userId: ..., 
  };
  mutation.mutate(cancelMyJoinRequestVars);
  // Variables can be defined inline as well.
  mutation.mutate({ familyId: ..., userId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(cancelMyJoinRequestVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyJoinRequest_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## LeaveMyFamily
You can execute the `LeaveMyFamily` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useLeaveMyFamily(options?: useDataConnectMutationOptions<LeaveMyFamilyData, FirebaseError, LeaveMyFamilyVariables>): UseDataConnectMutationResult<LeaveMyFamilyData, LeaveMyFamilyVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useLeaveMyFamily(dc: DataConnect, options?: useDataConnectMutationOptions<LeaveMyFamilyData, FirebaseError, LeaveMyFamilyVariables>): UseDataConnectMutationResult<LeaveMyFamilyData, LeaveMyFamilyVariables>;
```

### Variables
The `LeaveMyFamily` Mutation requires an argument of type `LeaveMyFamilyVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface LeaveMyFamilyVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that calling the `LeaveMyFamily` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `LeaveMyFamily` Mutation is of type `LeaveMyFamilyData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface LeaveMyFamilyData {
  user_update?: User_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `LeaveMyFamily`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, LeaveMyFamilyVariables } from '@financeconnect/generated';
import { useLeaveMyFamily } from '@financeconnect/generated/react'

export default function LeaveMyFamilyComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useLeaveMyFamily();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useLeaveMyFamily(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useLeaveMyFamily(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useLeaveMyFamily(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useLeaveMyFamily` Mutation requires an argument of type `LeaveMyFamilyVariables`:
  const leaveMyFamilyVars: LeaveMyFamilyVariables = {
    userId: ..., 
  };
  mutation.mutate(leaveMyFamilyVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(leaveMyFamilyVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.user_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## RegenerateFamilyInviteCode
You can execute the `RegenerateFamilyInviteCode` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useRegenerateFamilyInviteCode(options?: useDataConnectMutationOptions<RegenerateFamilyInviteCodeData, FirebaseError, RegenerateFamilyInviteCodeVariables>): UseDataConnectMutationResult<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useRegenerateFamilyInviteCode(dc: DataConnect, options?: useDataConnectMutationOptions<RegenerateFamilyInviteCodeData, FirebaseError, RegenerateFamilyInviteCodeVariables>): UseDataConnectMutationResult<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;
```

### Variables
The `RegenerateFamilyInviteCode` Mutation requires an argument of type `RegenerateFamilyInviteCodeVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface RegenerateFamilyInviteCodeVariables {
  familyId: UUIDString;
  inviteCode: string;
}
```
### Return Type
Recall that calling the `RegenerateFamilyInviteCode` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `RegenerateFamilyInviteCode` Mutation is of type `RegenerateFamilyInviteCodeData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface RegenerateFamilyInviteCodeData {
  family_update?: Family_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `RegenerateFamilyInviteCode`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, RegenerateFamilyInviteCodeVariables } from '@financeconnect/generated';
import { useRegenerateFamilyInviteCode } from '@financeconnect/generated/react'

export default function RegenerateFamilyInviteCodeComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useRegenerateFamilyInviteCode();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useRegenerateFamilyInviteCode(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRegenerateFamilyInviteCode(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useRegenerateFamilyInviteCode(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useRegenerateFamilyInviteCode` Mutation requires an argument of type `RegenerateFamilyInviteCodeVariables`:
  const regenerateFamilyInviteCodeVars: RegenerateFamilyInviteCodeVariables = {
    familyId: ..., 
    inviteCode: ..., 
  };
  mutation.mutate(regenerateFamilyInviteCodeVars);
  // Variables can be defined inline as well.
  mutation.mutate({ familyId: ..., inviteCode: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(regenerateFamilyInviteCodeVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.family_update);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateUserSettingForUser
You can execute the `CreateUserSettingForUser` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateUserSettingForUser(options?: useDataConnectMutationOptions<CreateUserSettingForUserData, FirebaseError, CreateUserSettingForUserVariables>): UseDataConnectMutationResult<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateUserSettingForUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserSettingForUserData, FirebaseError, CreateUserSettingForUserVariables>): UseDataConnectMutationResult<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;
```

### Variables
The `CreateUserSettingForUser` Mutation requires an argument of type `CreateUserSettingForUserVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateUserSettingForUserVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that calling the `CreateUserSettingForUser` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateUserSettingForUser` Mutation is of type `CreateUserSettingForUserData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateUserSettingForUserData {
  userSetting_insert: UserSetting_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateUserSettingForUser`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateUserSettingForUserVariables } from '@financeconnect/generated';
import { useCreateUserSettingForUser } from '@financeconnect/generated/react'

export default function CreateUserSettingForUserComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateUserSettingForUser();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateUserSettingForUser(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateUserSettingForUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateUserSettingForUser(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateUserSettingForUser` Mutation requires an argument of type `CreateUserSettingForUserVariables`:
  const createUserSettingForUserVars: CreateUserSettingForUserVariables = {
    userId: ..., 
  };
  mutation.mutate(createUserSettingForUserVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createUserSettingForUserVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userSetting_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateSelfFamilyMemberForUser
You can execute the `CreateSelfFamilyMemberForUser` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateSelfFamilyMemberForUser(options?: useDataConnectMutationOptions<CreateSelfFamilyMemberForUserData, FirebaseError, CreateSelfFamilyMemberForUserVariables>): UseDataConnectMutationResult<CreateSelfFamilyMemberForUserData, CreateSelfFamilyMemberForUserVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateSelfFamilyMemberForUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSelfFamilyMemberForUserData, FirebaseError, CreateSelfFamilyMemberForUserVariables>): UseDataConnectMutationResult<CreateSelfFamilyMemberForUserData, CreateSelfFamilyMemberForUserVariables>;
```

### Variables
The `CreateSelfFamilyMemberForUser` Mutation requires an argument of type `CreateSelfFamilyMemberForUserVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateSelfFamilyMemberForUserVariables {
  userId: UUIDString;
  familyMemberId: UUIDString;
  name: string;
}
```
### Return Type
Recall that calling the `CreateSelfFamilyMemberForUser` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateSelfFamilyMemberForUser` Mutation is of type `CreateSelfFamilyMemberForUserData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateSelfFamilyMemberForUserData {
  familyMember_insert: FamilyMember_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateSelfFamilyMemberForUser`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateSelfFamilyMemberForUserVariables } from '@financeconnect/generated';
import { useCreateSelfFamilyMemberForUser } from '@financeconnect/generated/react'

export default function CreateSelfFamilyMemberForUserComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateSelfFamilyMemberForUser();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateSelfFamilyMemberForUser(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSelfFamilyMemberForUser(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSelfFamilyMemberForUser(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateSelfFamilyMemberForUser` Mutation requires an argument of type `CreateSelfFamilyMemberForUserVariables`:
  const createSelfFamilyMemberForUserVars: CreateSelfFamilyMemberForUserVariables = {
    userId: ..., 
    familyMemberId: ..., 
    name: ..., 
  };
  mutation.mutate(createSelfFamilyMemberForUserVars);
  // Variables can be defined inline as well.
  mutation.mutate({ userId: ..., familyMemberId: ..., name: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createSelfFamilyMemberForUserVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.familyMember_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

