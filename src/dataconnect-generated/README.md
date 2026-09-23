# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `finance`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `finance`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@financeconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@financeconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `finance` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListUsers
You can execute the `ListUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUsersRef:
```typescript
const name = listUsersRef.operationName;
console.log(name);
```

### Variables
The `ListUsers` query has no variables.
### Return Type
Recall that executing the `ListUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUsersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUsers } from '@financeconnect/generated';


// Call the `listUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUsersRef } from '@financeconnect/generated';


// Call the `listUsersRef()` function to get a reference to the query.
const ref = listUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetMyUser
You can execute the `GetMyUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyUser(options?: ExecuteQueryOptions): QueryPromise<GetMyUserData, undefined>;

interface GetMyUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyUserData, undefined>;
}
export const getMyUserRef: GetMyUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyUserData, undefined>;

interface GetMyUserRef {
  ...
  (dc: DataConnect): QueryRef<GetMyUserData, undefined>;
}
export const getMyUserRef: GetMyUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyUserRef:
```typescript
const name = getMyUserRef.operationName;
console.log(name);
```

### Variables
The `GetMyUser` query has no variables.
### Return Type
Recall that executing the `GetMyUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMyUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyUser } from '@financeconnect/generated';


// Call the `getMyUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyUser(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getMyUser().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetMyUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyUserRef } from '@financeconnect/generated';


// Call the `getMyUserRef()` function to get a reference to the query.
const ref = getMyUserRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyUserRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListColorSchemes
You can execute the `ListColorSchemes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listColorSchemes(options?: ExecuteQueryOptions): QueryPromise<ListColorSchemesData, undefined>;

interface ListColorSchemesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListColorSchemesData, undefined>;
}
export const listColorSchemesRef: ListColorSchemesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listColorSchemes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListColorSchemesData, undefined>;

interface ListColorSchemesRef {
  ...
  (dc: DataConnect): QueryRef<ListColorSchemesData, undefined>;
}
export const listColorSchemesRef: ListColorSchemesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listColorSchemesRef:
```typescript
const name = listColorSchemesRef.operationName;
console.log(name);
```

### Variables
The `ListColorSchemes` query has no variables.
### Return Type
Recall that executing the `ListColorSchemes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListColorSchemesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListColorSchemes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listColorSchemes } from '@financeconnect/generated';


// Call the `listColorSchemes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listColorSchemes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listColorSchemes(dataConnect);

console.log(data.colorSchemes);

// Or, you can use the `Promise` API.
listColorSchemes().then((response) => {
  const data = response.data;
  console.log(data.colorSchemes);
});
```

### Using `ListColorSchemes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listColorSchemesRef } from '@financeconnect/generated';


// Call the `listColorSchemesRef()` function to get a reference to the query.
const ref = listColorSchemesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listColorSchemesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.colorSchemes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.colorSchemes);
});
```

## ListUserTypes
You can execute the `ListUserTypes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUserTypes(options?: ExecuteQueryOptions): QueryPromise<ListUserTypesData, undefined>;

interface ListUserTypesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUserTypesData, undefined>;
}
export const listUserTypesRef: ListUserTypesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUserTypes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUserTypesData, undefined>;

interface ListUserTypesRef {
  ...
  (dc: DataConnect): QueryRef<ListUserTypesData, undefined>;
}
export const listUserTypesRef: ListUserTypesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUserTypesRef:
```typescript
const name = listUserTypesRef.operationName;
console.log(name);
```

### Variables
The `ListUserTypes` query has no variables.
### Return Type
Recall that executing the `ListUserTypes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUserTypesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUserTypesData {
  userTypes: ({
    id: UUIDString;
    name: string;
    createdAt: TimestampString;
  } & UserType_Key)[];
}
```
### Using `ListUserTypes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUserTypes } from '@financeconnect/generated';


// Call the `listUserTypes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUserTypes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUserTypes(dataConnect);

console.log(data.userTypes);

// Or, you can use the `Promise` API.
listUserTypes().then((response) => {
  const data = response.data;
  console.log(data.userTypes);
});
```

### Using `ListUserTypes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUserTypesRef } from '@financeconnect/generated';


// Call the `listUserTypesRef()` function to get a reference to the query.
const ref = listUserTypesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUserTypesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userTypes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userTypes);
});
```

## GetUserAccessByGoogleUid
You can execute the `GetUserAccessByGoogleUid` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserAccessByGoogleUid(vars: GetUserAccessByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;

interface GetUserAccessByGoogleUidRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserAccessByGoogleUidVariables): QueryRef<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;
}
export const getUserAccessByGoogleUidRef: GetUserAccessByGoogleUidRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserAccessByGoogleUid(dc: DataConnect, vars: GetUserAccessByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;

interface GetUserAccessByGoogleUidRef {
  ...
  (dc: DataConnect, vars: GetUserAccessByGoogleUidVariables): QueryRef<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;
}
export const getUserAccessByGoogleUidRef: GetUserAccessByGoogleUidRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserAccessByGoogleUidRef:
```typescript
const name = getUserAccessByGoogleUidRef.operationName;
console.log(name);
```

### Variables
The `GetUserAccessByGoogleUid` query requires an argument of type `GetUserAccessByGoogleUidVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserAccessByGoogleUidVariables {
  googleUid: string;
}
```
### Return Type
Recall that executing the `GetUserAccessByGoogleUid` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserAccessByGoogleUidData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetUserAccessByGoogleUid`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserAccessByGoogleUid, GetUserAccessByGoogleUidVariables } from '@financeconnect/generated';

// The `GetUserAccessByGoogleUid` query requires an argument of type `GetUserAccessByGoogleUidVariables`:
const getUserAccessByGoogleUidVars: GetUserAccessByGoogleUidVariables = {
  googleUid: ..., 
};

// Call the `getUserAccessByGoogleUid()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserAccessByGoogleUid(getUserAccessByGoogleUidVars);
// Variables can be defined inline as well.
const { data } = await getUserAccessByGoogleUid({ googleUid: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserAccessByGoogleUid(dataConnect, getUserAccessByGoogleUidVars);

console.log(data.user);

// Or, you can use the `Promise` API.
getUserAccessByGoogleUid(getUserAccessByGoogleUidVars).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUserAccessByGoogleUid`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserAccessByGoogleUidRef, GetUserAccessByGoogleUidVariables } from '@financeconnect/generated';

// The `GetUserAccessByGoogleUid` query requires an argument of type `GetUserAccessByGoogleUidVariables`:
const getUserAccessByGoogleUidVars: GetUserAccessByGoogleUidVariables = {
  googleUid: ..., 
};

// Call the `getUserAccessByGoogleUidRef()` function to get a reference to the query.
const ref = getUserAccessByGoogleUidRef(getUserAccessByGoogleUidVars);
// Variables can be defined inline as well.
const ref = getUserAccessByGoogleUidRef({ googleUid: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserAccessByGoogleUidRef(dataConnect, getUserAccessByGoogleUidVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## GetUserProvisioningByGoogleUid
You can execute the `GetUserProvisioningByGoogleUid` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserProvisioningByGoogleUid(vars: GetUserProvisioningByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;

interface GetUserProvisioningByGoogleUidRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserProvisioningByGoogleUidVariables): QueryRef<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;
}
export const getUserProvisioningByGoogleUidRef: GetUserProvisioningByGoogleUidRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserProvisioningByGoogleUid(dc: DataConnect, vars: GetUserProvisioningByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;

interface GetUserProvisioningByGoogleUidRef {
  ...
  (dc: DataConnect, vars: GetUserProvisioningByGoogleUidVariables): QueryRef<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;
}
export const getUserProvisioningByGoogleUidRef: GetUserProvisioningByGoogleUidRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserProvisioningByGoogleUidRef:
```typescript
const name = getUserProvisioningByGoogleUidRef.operationName;
console.log(name);
```

### Variables
The `GetUserProvisioningByGoogleUid` query requires an argument of type `GetUserProvisioningByGoogleUidVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserProvisioningByGoogleUidVariables {
  googleUid: string;
}
```
### Return Type
Recall that executing the `GetUserProvisioningByGoogleUid` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserProvisioningByGoogleUidData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserProvisioningByGoogleUidData {
  user?: {
    id: UUIDString;
    userSetting?: {
      id: UUIDString;
    } & UserSetting_Key;
  } & User_Key;
}
```
### Using `GetUserProvisioningByGoogleUid`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserProvisioningByGoogleUid, GetUserProvisioningByGoogleUidVariables } from '@financeconnect/generated';

// The `GetUserProvisioningByGoogleUid` query requires an argument of type `GetUserProvisioningByGoogleUidVariables`:
const getUserProvisioningByGoogleUidVars: GetUserProvisioningByGoogleUidVariables = {
  googleUid: ..., 
};

// Call the `getUserProvisioningByGoogleUid()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserProvisioningByGoogleUid(getUserProvisioningByGoogleUidVars);
// Variables can be defined inline as well.
const { data } = await getUserProvisioningByGoogleUid({ googleUid: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserProvisioningByGoogleUid(dataConnect, getUserProvisioningByGoogleUidVars);

console.log(data.user);

// Or, you can use the `Promise` API.
getUserProvisioningByGoogleUid(getUserProvisioningByGoogleUidVars).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUserProvisioningByGoogleUid`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserProvisioningByGoogleUidRef, GetUserProvisioningByGoogleUidVariables } from '@financeconnect/generated';

// The `GetUserProvisioningByGoogleUid` query requires an argument of type `GetUserProvisioningByGoogleUidVariables`:
const getUserProvisioningByGoogleUidVars: GetUserProvisioningByGoogleUidVariables = {
  googleUid: ..., 
};

// Call the `getUserProvisioningByGoogleUidRef()` function to get a reference to the query.
const ref = getUserProvisioningByGoogleUidRef(getUserProvisioningByGoogleUidVars);
// Variables can be defined inline as well.
const ref = getUserProvisioningByGoogleUidRef({ googleUid: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserProvisioningByGoogleUidRef(dataConnect, getUserProvisioningByGoogleUidVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListFamilyMembers
You can execute the `ListFamilyMembers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listFamilyMembers(vars?: ListFamilyMembersVariables, options?: ExecuteQueryOptions): QueryPromise<ListFamilyMembersData, ListFamilyMembersVariables>;

interface ListFamilyMembersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListFamilyMembersVariables): QueryRef<ListFamilyMembersData, ListFamilyMembersVariables>;
}
export const listFamilyMembersRef: ListFamilyMembersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listFamilyMembers(dc: DataConnect, vars?: ListFamilyMembersVariables, options?: ExecuteQueryOptions): QueryPromise<ListFamilyMembersData, ListFamilyMembersVariables>;

interface ListFamilyMembersRef {
  ...
  (dc: DataConnect, vars?: ListFamilyMembersVariables): QueryRef<ListFamilyMembersData, ListFamilyMembersVariables>;
}
export const listFamilyMembersRef: ListFamilyMembersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listFamilyMembersRef:
```typescript
const name = listFamilyMembersRef.operationName;
console.log(name);
```

### Variables
The `ListFamilyMembers` query has an optional argument of type `ListFamilyMembersVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListFamilyMembersVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListFamilyMembers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListFamilyMembersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
  } & FamilyMember_Key)[];
}
```
### Using `ListFamilyMembers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listFamilyMembers, ListFamilyMembersVariables } from '@financeconnect/generated';

// The `ListFamilyMembers` query has an optional argument of type `ListFamilyMembersVariables`:
const listFamilyMembersVars: ListFamilyMembersVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listFamilyMembers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listFamilyMembers(listFamilyMembersVars);
// Variables can be defined inline as well.
const { data } = await listFamilyMembers({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListFamilyMembersVariables` argument.
const { data } = await listFamilyMembers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listFamilyMembers(dataConnect, listFamilyMembersVars);

console.log(data.familyMembers);

// Or, you can use the `Promise` API.
listFamilyMembers(listFamilyMembersVars).then((response) => {
  const data = response.data;
  console.log(data.familyMembers);
});
```

### Using `ListFamilyMembers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listFamilyMembersRef, ListFamilyMembersVariables } from '@financeconnect/generated';

// The `ListFamilyMembers` query has an optional argument of type `ListFamilyMembersVariables`:
const listFamilyMembersVars: ListFamilyMembersVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listFamilyMembersRef()` function to get a reference to the query.
const ref = listFamilyMembersRef(listFamilyMembersVars);
// Variables can be defined inline as well.
const ref = listFamilyMembersRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListFamilyMembersVariables` argument.
const ref = listFamilyMembersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listFamilyMembersRef(dataConnect, listFamilyMembersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.familyMembers);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.familyMembers);
});
```

## ListCategories
You can execute the `ListCategories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listCategories(vars?: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;

interface ListCategoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
}
export const listCategoriesRef: ListCategoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listCategories(dc: DataConnect, vars?: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;

interface ListCategoriesRef {
  ...
  (dc: DataConnect, vars?: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
}
export const listCategoriesRef: ListCategoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listCategoriesRef:
```typescript
const name = listCategoriesRef.operationName;
console.log(name);
```

### Variables
The `ListCategories` query has an optional argument of type `ListCategoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListCategoriesVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListCategories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListCategoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListCategories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listCategories, ListCategoriesVariables } from '@financeconnect/generated';

// The `ListCategories` query has an optional argument of type `ListCategoriesVariables`:
const listCategoriesVars: ListCategoriesVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCategories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listCategories(listCategoriesVars);
// Variables can be defined inline as well.
const { data } = await listCategories({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCategoriesVariables` argument.
const { data } = await listCategories();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listCategories(dataConnect, listCategoriesVars);

console.log(data.categories);

// Or, you can use the `Promise` API.
listCategories(listCategoriesVars).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

### Using `ListCategories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listCategoriesRef, ListCategoriesVariables } from '@financeconnect/generated';

// The `ListCategories` query has an optional argument of type `ListCategoriesVariables`:
const listCategoriesVars: ListCategoriesVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listCategoriesRef()` function to get a reference to the query.
const ref = listCategoriesRef(listCategoriesVars);
// Variables can be defined inline as well.
const ref = listCategoriesRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListCategoriesVariables` argument.
const ref = listCategoriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listCategoriesRef(dataConnect, listCategoriesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

## ListTransactionsByFamilyMember
You can execute the `ListTransactionsByFamilyMember` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listTransactionsByFamilyMember(vars: ListTransactionsByFamilyMemberVariables, options?: ExecuteQueryOptions): QueryPromise<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;

interface ListTransactionsByFamilyMemberRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListTransactionsByFamilyMemberVariables): QueryRef<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;
}
export const listTransactionsByFamilyMemberRef: ListTransactionsByFamilyMemberRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTransactionsByFamilyMember(dc: DataConnect, vars: ListTransactionsByFamilyMemberVariables, options?: ExecuteQueryOptions): QueryPromise<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;

interface ListTransactionsByFamilyMemberRef {
  ...
  (dc: DataConnect, vars: ListTransactionsByFamilyMemberVariables): QueryRef<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;
}
export const listTransactionsByFamilyMemberRef: ListTransactionsByFamilyMemberRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTransactionsByFamilyMemberRef:
```typescript
const name = listTransactionsByFamilyMemberRef.operationName;
console.log(name);
```

### Variables
The `ListTransactionsByFamilyMember` query requires an argument of type `ListTransactionsByFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListTransactionsByFamilyMemberVariables {
  familyMemberId: UUIDString;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListTransactionsByFamilyMember` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTransactionsByFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListTransactionsByFamilyMember`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTransactionsByFamilyMember, ListTransactionsByFamilyMemberVariables } from '@financeconnect/generated';

// The `ListTransactionsByFamilyMember` query requires an argument of type `ListTransactionsByFamilyMemberVariables`:
const listTransactionsByFamilyMemberVars: ListTransactionsByFamilyMemberVariables = {
  familyMemberId: ..., 
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listTransactionsByFamilyMember()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTransactionsByFamilyMember(listTransactionsByFamilyMemberVars);
// Variables can be defined inline as well.
const { data } = await listTransactionsByFamilyMember({ familyMemberId: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTransactionsByFamilyMember(dataConnect, listTransactionsByFamilyMemberVars);

console.log(data.transactions);

// Or, you can use the `Promise` API.
listTransactionsByFamilyMember(listTransactionsByFamilyMemberVars).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

### Using `ListTransactionsByFamilyMember`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTransactionsByFamilyMemberRef, ListTransactionsByFamilyMemberVariables } from '@financeconnect/generated';

// The `ListTransactionsByFamilyMember` query requires an argument of type `ListTransactionsByFamilyMemberVariables`:
const listTransactionsByFamilyMemberVars: ListTransactionsByFamilyMemberVariables = {
  familyMemberId: ..., 
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listTransactionsByFamilyMemberRef()` function to get a reference to the query.
const ref = listTransactionsByFamilyMemberRef(listTransactionsByFamilyMemberVars);
// Variables can be defined inline as well.
const ref = listTransactionsByFamilyMemberRef({ familyMemberId: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTransactionsByFamilyMemberRef(dataConnect, listTransactionsByFamilyMemberVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transactions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

## ListMyTransactions
You can execute the `ListMyTransactions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyTransactions(vars?: ListMyTransactionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, ListMyTransactionsVariables>;

interface ListMyTransactionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListMyTransactionsVariables): QueryRef<ListMyTransactionsData, ListMyTransactionsVariables>;
}
export const listMyTransactionsRef: ListMyTransactionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyTransactions(dc: DataConnect, vars?: ListMyTransactionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, ListMyTransactionsVariables>;

interface ListMyTransactionsRef {
  ...
  (dc: DataConnect, vars?: ListMyTransactionsVariables): QueryRef<ListMyTransactionsData, ListMyTransactionsVariables>;
}
export const listMyTransactionsRef: ListMyTransactionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyTransactionsRef:
```typescript
const name = listMyTransactionsRef.operationName;
console.log(name);
```

### Variables
The `ListMyTransactions` query has an optional argument of type `ListMyTransactionsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMyTransactionsVariables {
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListMyTransactions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyTransactionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMyTransactions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyTransactions, ListMyTransactionsVariables } from '@financeconnect/generated';

// The `ListMyTransactions` query has an optional argument of type `ListMyTransactionsVariables`:
const listMyTransactionsVars: ListMyTransactionsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listMyTransactions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyTransactions(listMyTransactionsVars);
// Variables can be defined inline as well.
const { data } = await listMyTransactions({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListMyTransactionsVariables` argument.
const { data } = await listMyTransactions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyTransactions(dataConnect, listMyTransactionsVars);

console.log(data.transactions);

// Or, you can use the `Promise` API.
listMyTransactions(listMyTransactionsVars).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

### Using `ListMyTransactions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyTransactionsRef, ListMyTransactionsVariables } from '@financeconnect/generated';

// The `ListMyTransactions` query has an optional argument of type `ListMyTransactionsVariables`:
const listMyTransactionsVars: ListMyTransactionsVariables = {
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listMyTransactionsRef()` function to get a reference to the query.
const ref = listMyTransactionsRef(listMyTransactionsVars);
// Variables can be defined inline as well.
const ref = listMyTransactionsRef({ limit: ..., offset: ..., });
// Since all variables are optional for this query, you can omit the `ListMyTransactionsVariables` argument.
const ref = listMyTransactionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyTransactionsRef(dataConnect, listMyTransactionsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transactions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

## ListMyTransactionsByDateRange
You can execute the `ListMyTransactionsByDateRange` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyTransactionsByDateRange(vars: ListMyTransactionsByDateRangeVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;

interface ListMyTransactionsByDateRangeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyTransactionsByDateRangeVariables): QueryRef<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;
}
export const listMyTransactionsByDateRangeRef: ListMyTransactionsByDateRangeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyTransactionsByDateRange(dc: DataConnect, vars: ListMyTransactionsByDateRangeVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;

interface ListMyTransactionsByDateRangeRef {
  ...
  (dc: DataConnect, vars: ListMyTransactionsByDateRangeVariables): QueryRef<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;
}
export const listMyTransactionsByDateRangeRef: ListMyTransactionsByDateRangeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyTransactionsByDateRangeRef:
```typescript
const name = listMyTransactionsByDateRangeRef.operationName;
console.log(name);
```

### Variables
The `ListMyTransactionsByDateRange` query requires an argument of type `ListMyTransactionsByDateRangeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMyTransactionsByDateRangeVariables {
  startDate: DateString;
  endDate: DateString;
  limit?: number | null;
  offset?: number | null;
}
```
### Return Type
Recall that executing the `ListMyTransactionsByDateRange` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyTransactionsByDateRangeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMyTransactionsByDateRange`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyTransactionsByDateRange, ListMyTransactionsByDateRangeVariables } from '@financeconnect/generated';

// The `ListMyTransactionsByDateRange` query requires an argument of type `ListMyTransactionsByDateRangeVariables`:
const listMyTransactionsByDateRangeVars: ListMyTransactionsByDateRangeVariables = {
  startDate: ..., 
  endDate: ..., 
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listMyTransactionsByDateRange()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyTransactionsByDateRange(listMyTransactionsByDateRangeVars);
// Variables can be defined inline as well.
const { data } = await listMyTransactionsByDateRange({ startDate: ..., endDate: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyTransactionsByDateRange(dataConnect, listMyTransactionsByDateRangeVars);

console.log(data.transactions);

// Or, you can use the `Promise` API.
listMyTransactionsByDateRange(listMyTransactionsByDateRangeVars).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

### Using `ListMyTransactionsByDateRange`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyTransactionsByDateRangeRef, ListMyTransactionsByDateRangeVariables } from '@financeconnect/generated';

// The `ListMyTransactionsByDateRange` query requires an argument of type `ListMyTransactionsByDateRangeVariables`:
const listMyTransactionsByDateRangeVars: ListMyTransactionsByDateRangeVariables = {
  startDate: ..., 
  endDate: ..., 
  limit: ..., // optional
  offset: ..., // optional
};

// Call the `listMyTransactionsByDateRangeRef()` function to get a reference to the query.
const ref = listMyTransactionsByDateRangeRef(listMyTransactionsByDateRangeVars);
// Variables can be defined inline as well.
const ref = listMyTransactionsByDateRangeRef({ startDate: ..., endDate: ..., limit: ..., offset: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyTransactionsByDateRangeRef(dataConnect, listMyTransactionsByDateRangeVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.transactions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.transactions);
});
```

## GetFamilyByInviteCode
You can execute the `GetFamilyByInviteCode` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getFamilyByInviteCode(vars: GetFamilyByInviteCodeVariables, options?: ExecuteQueryOptions): QueryPromise<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;

interface GetFamilyByInviteCodeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetFamilyByInviteCodeVariables): QueryRef<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;
}
export const getFamilyByInviteCodeRef: GetFamilyByInviteCodeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getFamilyByInviteCode(dc: DataConnect, vars: GetFamilyByInviteCodeVariables, options?: ExecuteQueryOptions): QueryPromise<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;

interface GetFamilyByInviteCodeRef {
  ...
  (dc: DataConnect, vars: GetFamilyByInviteCodeVariables): QueryRef<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;
}
export const getFamilyByInviteCodeRef: GetFamilyByInviteCodeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getFamilyByInviteCodeRef:
```typescript
const name = getFamilyByInviteCodeRef.operationName;
console.log(name);
```

### Variables
The `GetFamilyByInviteCode` query requires an argument of type `GetFamilyByInviteCodeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetFamilyByInviteCodeVariables {
  inviteCode: string;
}
```
### Return Type
Recall that executing the `GetFamilyByInviteCode` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetFamilyByInviteCodeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetFamilyByInviteCode`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getFamilyByInviteCode, GetFamilyByInviteCodeVariables } from '@financeconnect/generated';

// The `GetFamilyByInviteCode` query requires an argument of type `GetFamilyByInviteCodeVariables`:
const getFamilyByInviteCodeVars: GetFamilyByInviteCodeVariables = {
  inviteCode: ..., 
};

// Call the `getFamilyByInviteCode()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getFamilyByInviteCode(getFamilyByInviteCodeVars);
// Variables can be defined inline as well.
const { data } = await getFamilyByInviteCode({ inviteCode: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getFamilyByInviteCode(dataConnect, getFamilyByInviteCodeVars);

console.log(data.family);

// Or, you can use the `Promise` API.
getFamilyByInviteCode(getFamilyByInviteCodeVars).then((response) => {
  const data = response.data;
  console.log(data.family);
});
```

### Using `GetFamilyByInviteCode`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getFamilyByInviteCodeRef, GetFamilyByInviteCodeVariables } from '@financeconnect/generated';

// The `GetFamilyByInviteCode` query requires an argument of type `GetFamilyByInviteCodeVariables`:
const getFamilyByInviteCodeVars: GetFamilyByInviteCodeVariables = {
  inviteCode: ..., 
};

// Call the `getFamilyByInviteCodeRef()` function to get a reference to the query.
const ref = getFamilyByInviteCodeRef(getFamilyByInviteCodeVars);
// Variables can be defined inline as well.
const ref = getFamilyByInviteCodeRef({ inviteCode: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getFamilyByInviteCodeRef(dataConnect, getFamilyByInviteCodeVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.family);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.family);
});
```

## GetMyFamilyDetail
You can execute the `GetMyFamilyDetail` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyFamilyDetail(options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDetailData, undefined>;

interface GetMyFamilyDetailRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyFamilyDetailData, undefined>;
}
export const getMyFamilyDetailRef: GetMyFamilyDetailRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyFamilyDetail(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDetailData, undefined>;

interface GetMyFamilyDetailRef {
  ...
  (dc: DataConnect): QueryRef<GetMyFamilyDetailData, undefined>;
}
export const getMyFamilyDetailRef: GetMyFamilyDetailRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyFamilyDetailRef:
```typescript
const name = getMyFamilyDetailRef.operationName;
console.log(name);
```

### Variables
The `GetMyFamilyDetail` query has no variables.
### Return Type
Recall that executing the `GetMyFamilyDetail` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyFamilyDetailData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMyFamilyDetail`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyFamilyDetail } from '@financeconnect/generated';


// Call the `getMyFamilyDetail()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyFamilyDetail();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyFamilyDetail(dataConnect);

console.log(data.families);

// Or, you can use the `Promise` API.
getMyFamilyDetail().then((response) => {
  const data = response.data;
  console.log(data.families);
});
```

### Using `GetMyFamilyDetail`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyFamilyDetailRef } from '@financeconnect/generated';


// Call the `getMyFamilyDetailRef()` function to get a reference to the query.
const ref = getMyFamilyDetailRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyFamilyDetailRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.families);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.families);
});
```

## GetMyJoinRequests
You can execute the `GetMyJoinRequests` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyJoinRequests(options?: ExecuteQueryOptions): QueryPromise<GetMyJoinRequestsData, undefined>;

interface GetMyJoinRequestsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyJoinRequestsData, undefined>;
}
export const getMyJoinRequestsRef: GetMyJoinRequestsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyJoinRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyJoinRequestsData, undefined>;

interface GetMyJoinRequestsRef {
  ...
  (dc: DataConnect): QueryRef<GetMyJoinRequestsData, undefined>;
}
export const getMyJoinRequestsRef: GetMyJoinRequestsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyJoinRequestsRef:
```typescript
const name = getMyJoinRequestsRef.operationName;
console.log(name);
```

### Variables
The `GetMyJoinRequests` query has no variables.
### Return Type
Recall that executing the `GetMyJoinRequests` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyJoinRequestsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMyJoinRequests`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyJoinRequests } from '@financeconnect/generated';


// Call the `getMyJoinRequests()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyJoinRequests();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyJoinRequests(dataConnect);

console.log(data.familyJoinRequests);

// Or, you can use the `Promise` API.
getMyJoinRequests().then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequests);
});
```

### Using `GetMyJoinRequests`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyJoinRequestsRef } from '@financeconnect/generated';


// Call the `getMyJoinRequestsRef()` function to get a reference to the query.
const ref = getMyJoinRequestsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyJoinRequestsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.familyJoinRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequests);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `finance` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUserFromGoogle
You can execute the `CreateUserFromGoogle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUserFromGoogle(vars: CreateUserFromGoogleVariables): MutationPromise<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;

interface CreateUserFromGoogleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserFromGoogleVariables): MutationRef<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;
}
export const createUserFromGoogleRef: CreateUserFromGoogleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUserFromGoogle(dc: DataConnect, vars: CreateUserFromGoogleVariables): MutationPromise<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;

interface CreateUserFromGoogleRef {
  ...
  (dc: DataConnect, vars: CreateUserFromGoogleVariables): MutationRef<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;
}
export const createUserFromGoogleRef: CreateUserFromGoogleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserFromGoogleRef:
```typescript
const name = createUserFromGoogleRef.operationName;
console.log(name);
```

### Variables
The `CreateUserFromGoogle` mutation requires an argument of type `CreateUserFromGoogleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserFromGoogleVariables {
  googleUid: string;
  username: string;
  email: string;
  createdAt: TimestampString;
  userTypeName?: string;
}
```
### Return Type
Recall that executing the `CreateUserFromGoogle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserFromGoogleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserFromGoogleData {
  userType_upsert: UserType_Key;
  user_insert: User_Key;
}
```
### Using `CreateUserFromGoogle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUserFromGoogle, CreateUserFromGoogleVariables } from '@financeconnect/generated';

// The `CreateUserFromGoogle` mutation requires an argument of type `CreateUserFromGoogleVariables`:
const createUserFromGoogleVars: CreateUserFromGoogleVariables = {
  googleUid: ..., 
  username: ..., 
  email: ..., 
  createdAt: ..., 
  userTypeName: ..., // optional
};

// Call the `createUserFromGoogle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUserFromGoogle(createUserFromGoogleVars);
// Variables can be defined inline as well.
const { data } = await createUserFromGoogle({ googleUid: ..., username: ..., email: ..., createdAt: ..., userTypeName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUserFromGoogle(dataConnect, createUserFromGoogleVars);

console.log(data.userType_upsert);
console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUserFromGoogle(createUserFromGoogleVars).then((response) => {
  const data = response.data;
  console.log(data.userType_upsert);
  console.log(data.user_insert);
});
```

### Using `CreateUserFromGoogle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserFromGoogleRef, CreateUserFromGoogleVariables } from '@financeconnect/generated';

// The `CreateUserFromGoogle` mutation requires an argument of type `CreateUserFromGoogleVariables`:
const createUserFromGoogleVars: CreateUserFromGoogleVariables = {
  googleUid: ..., 
  username: ..., 
  email: ..., 
  createdAt: ..., 
  userTypeName: ..., // optional
};

// Call the `createUserFromGoogleRef()` function to get a reference to the mutation.
const ref = createUserFromGoogleRef(createUserFromGoogleVars);
// Variables can be defined inline as well.
const ref = createUserFromGoogleRef({ googleUid: ..., username: ..., email: ..., createdAt: ..., userTypeName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserFromGoogleRef(dataConnect, createUserFromGoogleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userType_upsert);
console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userType_upsert);
  console.log(data.user_insert);
});
```

## SetUserType
You can execute the `SetUserType` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
setUserType(vars: SetUserTypeVariables): MutationPromise<SetUserTypeData, SetUserTypeVariables>;

interface SetUserTypeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetUserTypeVariables): MutationRef<SetUserTypeData, SetUserTypeVariables>;
}
export const setUserTypeRef: SetUserTypeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
setUserType(dc: DataConnect, vars: SetUserTypeVariables): MutationPromise<SetUserTypeData, SetUserTypeVariables>;

interface SetUserTypeRef {
  ...
  (dc: DataConnect, vars: SetUserTypeVariables): MutationRef<SetUserTypeData, SetUserTypeVariables>;
}
export const setUserTypeRef: SetUserTypeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the setUserTypeRef:
```typescript
const name = setUserTypeRef.operationName;
console.log(name);
```

### Variables
The `SetUserType` mutation requires an argument of type `SetUserTypeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SetUserTypeVariables {
  userId: UUIDString;
  userTypeName: string;
}
```
### Return Type
Recall that executing the `SetUserType` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SetUserTypeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SetUserTypeData {
  user_update?: User_Key | null;
}
```
### Using `SetUserType`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, setUserType, SetUserTypeVariables } from '@financeconnect/generated';

// The `SetUserType` mutation requires an argument of type `SetUserTypeVariables`:
const setUserTypeVars: SetUserTypeVariables = {
  userId: ..., 
  userTypeName: ..., 
};

// Call the `setUserType()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await setUserType(setUserTypeVars);
// Variables can be defined inline as well.
const { data } = await setUserType({ userId: ..., userTypeName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await setUserType(dataConnect, setUserTypeVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
setUserType(setUserTypeVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `SetUserType`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, setUserTypeRef, SetUserTypeVariables } from '@financeconnect/generated';

// The `SetUserType` mutation requires an argument of type `SetUserTypeVariables`:
const setUserTypeVars: SetUserTypeVariables = {
  userId: ..., 
  userTypeName: ..., 
};

// Call the `setUserTypeRef()` function to get a reference to the mutation.
const ref = setUserTypeRef(setUserTypeVars);
// Variables can be defined inline as well.
const ref = setUserTypeRef({ userId: ..., userTypeName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = setUserTypeRef(dataConnect, setUserTypeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## SelectMyColorScheme
You can execute the `SelectMyColorScheme` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyColorScheme(vars: SelectMyColorSchemeVariables): MutationPromise<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;

interface SelectMyColorSchemeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyColorSchemeVariables): MutationRef<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;
}
export const selectMyColorSchemeRef: SelectMyColorSchemeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyColorScheme(dc: DataConnect, vars: SelectMyColorSchemeVariables): MutationPromise<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;

interface SelectMyColorSchemeRef {
  ...
  (dc: DataConnect, vars: SelectMyColorSchemeVariables): MutationRef<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;
}
export const selectMyColorSchemeRef: SelectMyColorSchemeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyColorSchemeRef:
```typescript
const name = selectMyColorSchemeRef.operationName;
console.log(name);
```

### Variables
The `SelectMyColorScheme` mutation requires an argument of type `SelectMyColorSchemeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyColorSchemeVariables {
  colorSchemeId: UUIDString;
}
```
### Return Type
Recall that executing the `SelectMyColorScheme` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyColorSchemeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyColorSchemeData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyColorScheme`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyColorScheme, SelectMyColorSchemeVariables } from '@financeconnect/generated';

// The `SelectMyColorScheme` mutation requires an argument of type `SelectMyColorSchemeVariables`:
const selectMyColorSchemeVars: SelectMyColorSchemeVariables = {
  colorSchemeId: ..., 
};

// Call the `selectMyColorScheme()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyColorScheme(selectMyColorSchemeVars);
// Variables can be defined inline as well.
const { data } = await selectMyColorScheme({ colorSchemeId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyColorScheme(dataConnect, selectMyColorSchemeVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyColorScheme(selectMyColorSchemeVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyColorScheme`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyColorSchemeRef, SelectMyColorSchemeVariables } from '@financeconnect/generated';

// The `SelectMyColorScheme` mutation requires an argument of type `SelectMyColorSchemeVariables`:
const selectMyColorSchemeVars: SelectMyColorSchemeVariables = {
  colorSchemeId: ..., 
};

// Call the `selectMyColorSchemeRef()` function to get a reference to the mutation.
const ref = selectMyColorSchemeRef(selectMyColorSchemeVars);
// Variables can be defined inline as well.
const ref = selectMyColorSchemeRef({ colorSchemeId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyColorSchemeRef(dataConnect, selectMyColorSchemeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## ClearMyColorScheme
You can execute the `ClearMyColorScheme` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
clearMyColorScheme(): MutationPromise<ClearMyColorSchemeData, undefined>;

interface ClearMyColorSchemeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<ClearMyColorSchemeData, undefined>;
}
export const clearMyColorSchemeRef: ClearMyColorSchemeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
clearMyColorScheme(dc: DataConnect): MutationPromise<ClearMyColorSchemeData, undefined>;

interface ClearMyColorSchemeRef {
  ...
  (dc: DataConnect): MutationRef<ClearMyColorSchemeData, undefined>;
}
export const clearMyColorSchemeRef: ClearMyColorSchemeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the clearMyColorSchemeRef:
```typescript
const name = clearMyColorSchemeRef.operationName;
console.log(name);
```

### Variables
The `ClearMyColorScheme` mutation has no variables.
### Return Type
Recall that executing the `ClearMyColorScheme` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ClearMyColorSchemeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ClearMyColorSchemeData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `ClearMyColorScheme`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, clearMyColorScheme } from '@financeconnect/generated';


// Call the `clearMyColorScheme()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await clearMyColorScheme();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await clearMyColorScheme(dataConnect);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
clearMyColorScheme().then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `ClearMyColorScheme`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, clearMyColorSchemeRef } from '@financeconnect/generated';


// Call the `clearMyColorSchemeRef()` function to get a reference to the mutation.
const ref = clearMyColorSchemeRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = clearMyColorSchemeRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMyPerformanceMode
You can execute the `SelectMyPerformanceMode` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyPerformanceMode(vars: SelectMyPerformanceModeVariables): MutationPromise<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;

interface SelectMyPerformanceModeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyPerformanceModeVariables): MutationRef<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;
}
export const selectMyPerformanceModeRef: SelectMyPerformanceModeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyPerformanceMode(dc: DataConnect, vars: SelectMyPerformanceModeVariables): MutationPromise<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;

interface SelectMyPerformanceModeRef {
  ...
  (dc: DataConnect, vars: SelectMyPerformanceModeVariables): MutationRef<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;
}
export const selectMyPerformanceModeRef: SelectMyPerformanceModeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyPerformanceModeRef:
```typescript
const name = selectMyPerformanceModeRef.operationName;
console.log(name);
```

### Variables
The `SelectMyPerformanceMode` mutation requires an argument of type `SelectMyPerformanceModeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyPerformanceModeVariables {
  performanceMode: boolean;
}
```
### Return Type
Recall that executing the `SelectMyPerformanceMode` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyPerformanceModeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyPerformanceModeData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyPerformanceMode`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyPerformanceMode, SelectMyPerformanceModeVariables } from '@financeconnect/generated';

// The `SelectMyPerformanceMode` mutation requires an argument of type `SelectMyPerformanceModeVariables`:
const selectMyPerformanceModeVars: SelectMyPerformanceModeVariables = {
  performanceMode: ..., 
};

// Call the `selectMyPerformanceMode()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyPerformanceMode(selectMyPerformanceModeVars);
// Variables can be defined inline as well.
const { data } = await selectMyPerformanceMode({ performanceMode: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyPerformanceMode(dataConnect, selectMyPerformanceModeVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyPerformanceMode(selectMyPerformanceModeVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyPerformanceMode`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyPerformanceModeRef, SelectMyPerformanceModeVariables } from '@financeconnect/generated';

// The `SelectMyPerformanceMode` mutation requires an argument of type `SelectMyPerformanceModeVariables`:
const selectMyPerformanceModeVars: SelectMyPerformanceModeVariables = {
  performanceMode: ..., 
};

// Call the `selectMyPerformanceModeRef()` function to get a reference to the mutation.
const ref = selectMyPerformanceModeRef(selectMyPerformanceModeVars);
// Variables can be defined inline as well.
const ref = selectMyPerformanceModeRef({ performanceMode: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyPerformanceModeRef(dataConnect, selectMyPerformanceModeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMyBackgroundOpacity
You can execute the `SelectMyBackgroundOpacity` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyBackgroundOpacity(vars: SelectMyBackgroundOpacityVariables): MutationPromise<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;

interface SelectMyBackgroundOpacityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyBackgroundOpacityVariables): MutationRef<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;
}
export const selectMyBackgroundOpacityRef: SelectMyBackgroundOpacityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyBackgroundOpacity(dc: DataConnect, vars: SelectMyBackgroundOpacityVariables): MutationPromise<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;

interface SelectMyBackgroundOpacityRef {
  ...
  (dc: DataConnect, vars: SelectMyBackgroundOpacityVariables): MutationRef<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;
}
export const selectMyBackgroundOpacityRef: SelectMyBackgroundOpacityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyBackgroundOpacityRef:
```typescript
const name = selectMyBackgroundOpacityRef.operationName;
console.log(name);
```

### Variables
The `SelectMyBackgroundOpacity` mutation requires an argument of type `SelectMyBackgroundOpacityVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyBackgroundOpacityVariables {
  backgroundOpacity: number;
}
```
### Return Type
Recall that executing the `SelectMyBackgroundOpacity` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyBackgroundOpacityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyBackgroundOpacityData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyBackgroundOpacity`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyBackgroundOpacity, SelectMyBackgroundOpacityVariables } from '@financeconnect/generated';

// The `SelectMyBackgroundOpacity` mutation requires an argument of type `SelectMyBackgroundOpacityVariables`:
const selectMyBackgroundOpacityVars: SelectMyBackgroundOpacityVariables = {
  backgroundOpacity: ..., 
};

// Call the `selectMyBackgroundOpacity()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyBackgroundOpacity(selectMyBackgroundOpacityVars);
// Variables can be defined inline as well.
const { data } = await selectMyBackgroundOpacity({ backgroundOpacity: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyBackgroundOpacity(dataConnect, selectMyBackgroundOpacityVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyBackgroundOpacity(selectMyBackgroundOpacityVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyBackgroundOpacity`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyBackgroundOpacityRef, SelectMyBackgroundOpacityVariables } from '@financeconnect/generated';

// The `SelectMyBackgroundOpacity` mutation requires an argument of type `SelectMyBackgroundOpacityVariables`:
const selectMyBackgroundOpacityVars: SelectMyBackgroundOpacityVariables = {
  backgroundOpacity: ..., 
};

// Call the `selectMyBackgroundOpacityRef()` function to get a reference to the mutation.
const ref = selectMyBackgroundOpacityRef(selectMyBackgroundOpacityVars);
// Variables can be defined inline as well.
const ref = selectMyBackgroundOpacityRef({ backgroundOpacity: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyBackgroundOpacityRef(dataConnect, selectMyBackgroundOpacityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMyExternalAccountLinkTemplate
You can execute the `SelectMyExternalAccountLinkTemplate` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyExternalAccountLinkTemplate(vars?: SelectMyExternalAccountLinkTemplateVariables): MutationPromise<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;

interface SelectMyExternalAccountLinkTemplateRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: SelectMyExternalAccountLinkTemplateVariables): MutationRef<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;
}
export const selectMyExternalAccountLinkTemplateRef: SelectMyExternalAccountLinkTemplateRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyExternalAccountLinkTemplate(dc: DataConnect, vars?: SelectMyExternalAccountLinkTemplateVariables): MutationPromise<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;

interface SelectMyExternalAccountLinkTemplateRef {
  ...
  (dc: DataConnect, vars?: SelectMyExternalAccountLinkTemplateVariables): MutationRef<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;
}
export const selectMyExternalAccountLinkTemplateRef: SelectMyExternalAccountLinkTemplateRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyExternalAccountLinkTemplateRef:
```typescript
const name = selectMyExternalAccountLinkTemplateRef.operationName;
console.log(name);
```

### Variables
The `SelectMyExternalAccountLinkTemplate` mutation has an optional argument of type `SelectMyExternalAccountLinkTemplateVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyExternalAccountLinkTemplateVariables {
  externalAccountLinkTemplate?: string | null;
}
```
### Return Type
Recall that executing the `SelectMyExternalAccountLinkTemplate` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyExternalAccountLinkTemplateData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyExternalAccountLinkTemplateData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyExternalAccountLinkTemplate`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyExternalAccountLinkTemplate, SelectMyExternalAccountLinkTemplateVariables } from '@financeconnect/generated';

// The `SelectMyExternalAccountLinkTemplate` mutation has an optional argument of type `SelectMyExternalAccountLinkTemplateVariables`:
const selectMyExternalAccountLinkTemplateVars: SelectMyExternalAccountLinkTemplateVariables = {
  externalAccountLinkTemplate: ..., // optional
};

// Call the `selectMyExternalAccountLinkTemplate()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyExternalAccountLinkTemplate(selectMyExternalAccountLinkTemplateVars);
// Variables can be defined inline as well.
const { data } = await selectMyExternalAccountLinkTemplate({ externalAccountLinkTemplate: ..., });
// Since all variables are optional for this mutation, you can omit the `SelectMyExternalAccountLinkTemplateVariables` argument.
const { data } = await selectMyExternalAccountLinkTemplate();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyExternalAccountLinkTemplate(dataConnect, selectMyExternalAccountLinkTemplateVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyExternalAccountLinkTemplate(selectMyExternalAccountLinkTemplateVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyExternalAccountLinkTemplate`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyExternalAccountLinkTemplateRef, SelectMyExternalAccountLinkTemplateVariables } from '@financeconnect/generated';

// The `SelectMyExternalAccountLinkTemplate` mutation has an optional argument of type `SelectMyExternalAccountLinkTemplateVariables`:
const selectMyExternalAccountLinkTemplateVars: SelectMyExternalAccountLinkTemplateVariables = {
  externalAccountLinkTemplate: ..., // optional
};

// Call the `selectMyExternalAccountLinkTemplateRef()` function to get a reference to the mutation.
const ref = selectMyExternalAccountLinkTemplateRef(selectMyExternalAccountLinkTemplateVars);
// Variables can be defined inline as well.
const ref = selectMyExternalAccountLinkTemplateRef({ externalAccountLinkTemplate: ..., });
// Since all variables are optional for this mutation, you can omit the `SelectMyExternalAccountLinkTemplateVariables` argument.
const ref = selectMyExternalAccountLinkTemplateRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyExternalAccountLinkTemplateRef(dataConnect, selectMyExternalAccountLinkTemplateVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMyCardStyle
You can execute the `SelectMyCardStyle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyCardStyle(vars: SelectMyCardStyleVariables): MutationPromise<SelectMyCardStyleData, SelectMyCardStyleVariables>;

interface SelectMyCardStyleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyCardStyleVariables): MutationRef<SelectMyCardStyleData, SelectMyCardStyleVariables>;
}
export const selectMyCardStyleRef: SelectMyCardStyleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyCardStyle(dc: DataConnect, vars: SelectMyCardStyleVariables): MutationPromise<SelectMyCardStyleData, SelectMyCardStyleVariables>;

interface SelectMyCardStyleRef {
  ...
  (dc: DataConnect, vars: SelectMyCardStyleVariables): MutationRef<SelectMyCardStyleData, SelectMyCardStyleVariables>;
}
export const selectMyCardStyleRef: SelectMyCardStyleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyCardStyleRef:
```typescript
const name = selectMyCardStyleRef.operationName;
console.log(name);
```

### Variables
The `SelectMyCardStyle` mutation requires an argument of type `SelectMyCardStyleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyCardStyleVariables {
  cardOpacity: number;
  cardBlur: number;
}
```
### Return Type
Recall that executing the `SelectMyCardStyle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyCardStyleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyCardStyleData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyCardStyle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyCardStyle, SelectMyCardStyleVariables } from '@financeconnect/generated';

// The `SelectMyCardStyle` mutation requires an argument of type `SelectMyCardStyleVariables`:
const selectMyCardStyleVars: SelectMyCardStyleVariables = {
  cardOpacity: ..., 
  cardBlur: ..., 
};

// Call the `selectMyCardStyle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyCardStyle(selectMyCardStyleVars);
// Variables can be defined inline as well.
const { data } = await selectMyCardStyle({ cardOpacity: ..., cardBlur: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyCardStyle(dataConnect, selectMyCardStyleVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyCardStyle(selectMyCardStyleVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyCardStyle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyCardStyleRef, SelectMyCardStyleVariables } from '@financeconnect/generated';

// The `SelectMyCardStyle` mutation requires an argument of type `SelectMyCardStyleVariables`:
const selectMyCardStyleVars: SelectMyCardStyleVariables = {
  cardOpacity: ..., 
  cardBlur: ..., 
};

// Call the `selectMyCardStyleRef()` function to get a reference to the mutation.
const ref = selectMyCardStyleRef(selectMyCardStyleVars);
// Variables can be defined inline as well.
const ref = selectMyCardStyleRef({ cardOpacity: ..., cardBlur: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyCardStyleRef(dataConnect, selectMyCardStyleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMySquareCorners
You can execute the `SelectMySquareCorners` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMySquareCorners(vars: SelectMySquareCornersVariables): MutationPromise<SelectMySquareCornersData, SelectMySquareCornersVariables>;

interface SelectMySquareCornersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMySquareCornersVariables): MutationRef<SelectMySquareCornersData, SelectMySquareCornersVariables>;
}
export const selectMySquareCornersRef: SelectMySquareCornersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMySquareCorners(dc: DataConnect, vars: SelectMySquareCornersVariables): MutationPromise<SelectMySquareCornersData, SelectMySquareCornersVariables>;

interface SelectMySquareCornersRef {
  ...
  (dc: DataConnect, vars: SelectMySquareCornersVariables): MutationRef<SelectMySquareCornersData, SelectMySquareCornersVariables>;
}
export const selectMySquareCornersRef: SelectMySquareCornersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMySquareCornersRef:
```typescript
const name = selectMySquareCornersRef.operationName;
console.log(name);
```

### Variables
The `SelectMySquareCorners` mutation requires an argument of type `SelectMySquareCornersVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMySquareCornersVariables {
  squareCorners: boolean;
}
```
### Return Type
Recall that executing the `SelectMySquareCorners` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMySquareCornersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMySquareCornersData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMySquareCorners`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMySquareCorners, SelectMySquareCornersVariables } from '@financeconnect/generated';

// The `SelectMySquareCorners` mutation requires an argument of type `SelectMySquareCornersVariables`:
const selectMySquareCornersVars: SelectMySquareCornersVariables = {
  squareCorners: ..., 
};

// Call the `selectMySquareCorners()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMySquareCorners(selectMySquareCornersVars);
// Variables can be defined inline as well.
const { data } = await selectMySquareCorners({ squareCorners: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMySquareCorners(dataConnect, selectMySquareCornersVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMySquareCorners(selectMySquareCornersVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMySquareCorners`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMySquareCornersRef, SelectMySquareCornersVariables } from '@financeconnect/generated';

// The `SelectMySquareCorners` mutation requires an argument of type `SelectMySquareCornersVariables`:
const selectMySquareCornersVars: SelectMySquareCornersVariables = {
  squareCorners: ..., 
};

// Call the `selectMySquareCornersRef()` function to get a reference to the mutation.
const ref = selectMySquareCornersRef(selectMySquareCornersVars);
// Variables can be defined inline as well.
const ref = selectMySquareCornersRef({ squareCorners: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMySquareCornersRef(dataConnect, selectMySquareCornersVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMyBordersEnabled
You can execute the `SelectMyBordersEnabled` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyBordersEnabled(vars: SelectMyBordersEnabledVariables): MutationPromise<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;

interface SelectMyBordersEnabledRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyBordersEnabledVariables): MutationRef<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;
}
export const selectMyBordersEnabledRef: SelectMyBordersEnabledRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyBordersEnabled(dc: DataConnect, vars: SelectMyBordersEnabledVariables): MutationPromise<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;

interface SelectMyBordersEnabledRef {
  ...
  (dc: DataConnect, vars: SelectMyBordersEnabledVariables): MutationRef<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;
}
export const selectMyBordersEnabledRef: SelectMyBordersEnabledRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyBordersEnabledRef:
```typescript
const name = selectMyBordersEnabledRef.operationName;
console.log(name);
```

### Variables
The `SelectMyBordersEnabled` mutation requires an argument of type `SelectMyBordersEnabledVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyBordersEnabledVariables {
  bordersEnabled: boolean;
}
```
### Return Type
Recall that executing the `SelectMyBordersEnabled` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyBordersEnabledData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyBordersEnabledData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyBordersEnabled`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyBordersEnabled, SelectMyBordersEnabledVariables } from '@financeconnect/generated';

// The `SelectMyBordersEnabled` mutation requires an argument of type `SelectMyBordersEnabledVariables`:
const selectMyBordersEnabledVars: SelectMyBordersEnabledVariables = {
  bordersEnabled: ..., 
};

// Call the `selectMyBordersEnabled()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyBordersEnabled(selectMyBordersEnabledVars);
// Variables can be defined inline as well.
const { data } = await selectMyBordersEnabled({ bordersEnabled: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyBordersEnabled(dataConnect, selectMyBordersEnabledVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyBordersEnabled(selectMyBordersEnabledVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyBordersEnabled`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyBordersEnabledRef, SelectMyBordersEnabledVariables } from '@financeconnect/generated';

// The `SelectMyBordersEnabled` mutation requires an argument of type `SelectMyBordersEnabledVariables`:
const selectMyBordersEnabledVars: SelectMyBordersEnabledVariables = {
  bordersEnabled: ..., 
};

// Call the `selectMyBordersEnabledRef()` function to get a reference to the mutation.
const ref = selectMyBordersEnabledRef(selectMyBordersEnabledVars);
// Variables can be defined inline as well.
const ref = selectMyBordersEnabledRef({ bordersEnabled: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyBordersEnabledRef(dataConnect, selectMyBordersEnabledVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMyCategoryColorsEnabled
You can execute the `SelectMyCategoryColorsEnabled` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyCategoryColorsEnabled(vars: SelectMyCategoryColorsEnabledVariables): MutationPromise<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;

interface SelectMyCategoryColorsEnabledRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyCategoryColorsEnabledVariables): MutationRef<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;
}
export const selectMyCategoryColorsEnabledRef: SelectMyCategoryColorsEnabledRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyCategoryColorsEnabled(dc: DataConnect, vars: SelectMyCategoryColorsEnabledVariables): MutationPromise<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;

interface SelectMyCategoryColorsEnabledRef {
  ...
  (dc: DataConnect, vars: SelectMyCategoryColorsEnabledVariables): MutationRef<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;
}
export const selectMyCategoryColorsEnabledRef: SelectMyCategoryColorsEnabledRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyCategoryColorsEnabledRef:
```typescript
const name = selectMyCategoryColorsEnabledRef.operationName;
console.log(name);
```

### Variables
The `SelectMyCategoryColorsEnabled` mutation requires an argument of type `SelectMyCategoryColorsEnabledVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyCategoryColorsEnabledVariables {
  categoryColorsEnabled: boolean;
}
```
### Return Type
Recall that executing the `SelectMyCategoryColorsEnabled` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyCategoryColorsEnabledData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyCategoryColorsEnabledData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyCategoryColorsEnabled`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyCategoryColorsEnabled, SelectMyCategoryColorsEnabledVariables } from '@financeconnect/generated';

// The `SelectMyCategoryColorsEnabled` mutation requires an argument of type `SelectMyCategoryColorsEnabledVariables`:
const selectMyCategoryColorsEnabledVars: SelectMyCategoryColorsEnabledVariables = {
  categoryColorsEnabled: ..., 
};

// Call the `selectMyCategoryColorsEnabled()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyCategoryColorsEnabled(selectMyCategoryColorsEnabledVars);
// Variables can be defined inline as well.
const { data } = await selectMyCategoryColorsEnabled({ categoryColorsEnabled: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyCategoryColorsEnabled(dataConnect, selectMyCategoryColorsEnabledVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyCategoryColorsEnabled(selectMyCategoryColorsEnabledVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyCategoryColorsEnabled`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyCategoryColorsEnabledRef, SelectMyCategoryColorsEnabledVariables } from '@financeconnect/generated';

// The `SelectMyCategoryColorsEnabled` mutation requires an argument of type `SelectMyCategoryColorsEnabledVariables`:
const selectMyCategoryColorsEnabledVars: SelectMyCategoryColorsEnabledVariables = {
  categoryColorsEnabled: ..., 
};

// Call the `selectMyCategoryColorsEnabledRef()` function to get a reference to the mutation.
const ref = selectMyCategoryColorsEnabledRef(selectMyCategoryColorsEnabledVars);
// Variables can be defined inline as well.
const ref = selectMyCategoryColorsEnabledRef({ categoryColorsEnabled: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyCategoryColorsEnabledRef(dataConnect, selectMyCategoryColorsEnabledVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## SelectMyCurrency
You can execute the `SelectMyCurrency` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
selectMyCurrency(vars: SelectMyCurrencyVariables): MutationPromise<SelectMyCurrencyData, SelectMyCurrencyVariables>;

interface SelectMyCurrencyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyCurrencyVariables): MutationRef<SelectMyCurrencyData, SelectMyCurrencyVariables>;
}
export const selectMyCurrencyRef: SelectMyCurrencyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
selectMyCurrency(dc: DataConnect, vars: SelectMyCurrencyVariables): MutationPromise<SelectMyCurrencyData, SelectMyCurrencyVariables>;

interface SelectMyCurrencyRef {
  ...
  (dc: DataConnect, vars: SelectMyCurrencyVariables): MutationRef<SelectMyCurrencyData, SelectMyCurrencyVariables>;
}
export const selectMyCurrencyRef: SelectMyCurrencyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the selectMyCurrencyRef:
```typescript
const name = selectMyCurrencyRef.operationName;
console.log(name);
```

### Variables
The `SelectMyCurrency` mutation requires an argument of type `SelectMyCurrencyVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SelectMyCurrencyVariables {
  currencyCode: string;
}
```
### Return Type
Recall that executing the `SelectMyCurrency` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SelectMyCurrencyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SelectMyCurrencyData {
  userSetting_update?: UserSetting_Key | null;
}
```
### Using `SelectMyCurrency`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, selectMyCurrency, SelectMyCurrencyVariables } from '@financeconnect/generated';

// The `SelectMyCurrency` mutation requires an argument of type `SelectMyCurrencyVariables`:
const selectMyCurrencyVars: SelectMyCurrencyVariables = {
  currencyCode: ..., 
};

// Call the `selectMyCurrency()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await selectMyCurrency(selectMyCurrencyVars);
// Variables can be defined inline as well.
const { data } = await selectMyCurrency({ currencyCode: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await selectMyCurrency(dataConnect, selectMyCurrencyVars);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
selectMyCurrency(selectMyCurrencyVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

### Using `SelectMyCurrency`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, selectMyCurrencyRef, SelectMyCurrencyVariables } from '@financeconnect/generated';

// The `SelectMyCurrency` mutation requires an argument of type `SelectMyCurrencyVariables`:
const selectMyCurrencyVars: SelectMyCurrencyVariables = {
  currencyCode: ..., 
};

// Call the `selectMyCurrencyRef()` function to get a reference to the mutation.
const ref = selectMyCurrencyRef(selectMyCurrencyVars);
// Variables can be defined inline as well.
const ref = selectMyCurrencyRef({ currencyCode: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = selectMyCurrencyRef(dataConnect, selectMyCurrencyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_update);
});
```

## CreateFamilyMember
You can execute the `CreateFamilyMember` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createFamilyMember(vars: CreateFamilyMemberVariables): MutationPromise<CreateFamilyMemberData, CreateFamilyMemberVariables>;

interface CreateFamilyMemberRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateFamilyMemberVariables): MutationRef<CreateFamilyMemberData, CreateFamilyMemberVariables>;
}
export const createFamilyMemberRef: CreateFamilyMemberRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createFamilyMember(dc: DataConnect, vars: CreateFamilyMemberVariables): MutationPromise<CreateFamilyMemberData, CreateFamilyMemberVariables>;

interface CreateFamilyMemberRef {
  ...
  (dc: DataConnect, vars: CreateFamilyMemberVariables): MutationRef<CreateFamilyMemberData, CreateFamilyMemberVariables>;
}
export const createFamilyMemberRef: CreateFamilyMemberRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createFamilyMemberRef:
```typescript
const name = createFamilyMemberRef.operationName;
console.log(name);
```

### Variables
The `CreateFamilyMember` mutation requires an argument of type `CreateFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateFamilyMember` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateFamilyMemberData {
  familyMember_insert: FamilyMember_Key;
}
```
### Using `CreateFamilyMember`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createFamilyMember, CreateFamilyMemberVariables } from '@financeconnect/generated';

// The `CreateFamilyMember` mutation requires an argument of type `CreateFamilyMemberVariables`:
const createFamilyMemberVars: CreateFamilyMemberVariables = {
  userId: ..., 
  familyMemberId: ..., 
  name: ..., 
  relationship: ..., // optional
  color: ..., // optional
  monthlyIncomeTargetMinor: ..., // optional
};

// Call the `createFamilyMember()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createFamilyMember(createFamilyMemberVars);
// Variables can be defined inline as well.
const { data } = await createFamilyMember({ userId: ..., familyMemberId: ..., name: ..., relationship: ..., color: ..., monthlyIncomeTargetMinor: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createFamilyMember(dataConnect, createFamilyMemberVars);

console.log(data.familyMember_insert);

// Or, you can use the `Promise` API.
createFamilyMember(createFamilyMemberVars).then((response) => {
  const data = response.data;
  console.log(data.familyMember_insert);
});
```

### Using `CreateFamilyMember`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createFamilyMemberRef, CreateFamilyMemberVariables } from '@financeconnect/generated';

// The `CreateFamilyMember` mutation requires an argument of type `CreateFamilyMemberVariables`:
const createFamilyMemberVars: CreateFamilyMemberVariables = {
  userId: ..., 
  familyMemberId: ..., 
  name: ..., 
  relationship: ..., // optional
  color: ..., // optional
  monthlyIncomeTargetMinor: ..., // optional
};

// Call the `createFamilyMemberRef()` function to get a reference to the mutation.
const ref = createFamilyMemberRef(createFamilyMemberVars);
// Variables can be defined inline as well.
const ref = createFamilyMemberRef({ userId: ..., familyMemberId: ..., name: ..., relationship: ..., color: ..., monthlyIncomeTargetMinor: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createFamilyMemberRef(dataConnect, createFamilyMemberVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyMember_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyMember_insert);
});
```

## UpdateFamilyMember
You can execute the `UpdateFamilyMember` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateFamilyMember(vars: UpdateFamilyMemberVariables): MutationPromise<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;

interface UpdateFamilyMemberRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFamilyMemberVariables): MutationRef<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;
}
export const updateFamilyMemberRef: UpdateFamilyMemberRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateFamilyMember(dc: DataConnect, vars: UpdateFamilyMemberVariables): MutationPromise<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;

interface UpdateFamilyMemberRef {
  ...
  (dc: DataConnect, vars: UpdateFamilyMemberVariables): MutationRef<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;
}
export const updateFamilyMemberRef: UpdateFamilyMemberRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateFamilyMemberRef:
```typescript
const name = updateFamilyMemberRef.operationName;
console.log(name);
```

### Variables
The `UpdateFamilyMember` mutation requires an argument of type `UpdateFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateFamilyMember` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}
```
### Using `UpdateFamilyMember`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateFamilyMember, UpdateFamilyMemberVariables } from '@financeconnect/generated';

// The `UpdateFamilyMember` mutation requires an argument of type `UpdateFamilyMemberVariables`:
const updateFamilyMemberVars: UpdateFamilyMemberVariables = {
  familyMemberId: ..., 
  name: ..., 
  relationship: ..., // optional
  color: ..., // optional
  externalAccountRef: ..., // optional
  monthlyIncomeTargetMinor: ..., // optional
};

// Call the `updateFamilyMember()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateFamilyMember(updateFamilyMemberVars);
// Variables can be defined inline as well.
const { data } = await updateFamilyMember({ familyMemberId: ..., name: ..., relationship: ..., color: ..., externalAccountRef: ..., monthlyIncomeTargetMinor: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateFamilyMember(dataConnect, updateFamilyMemberVars);

console.log(data.familyMember_update);

// Or, you can use the `Promise` API.
updateFamilyMember(updateFamilyMemberVars).then((response) => {
  const data = response.data;
  console.log(data.familyMember_update);
});
```

### Using `UpdateFamilyMember`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateFamilyMemberRef, UpdateFamilyMemberVariables } from '@financeconnect/generated';

// The `UpdateFamilyMember` mutation requires an argument of type `UpdateFamilyMemberVariables`:
const updateFamilyMemberVars: UpdateFamilyMemberVariables = {
  familyMemberId: ..., 
  name: ..., 
  relationship: ..., // optional
  color: ..., // optional
  externalAccountRef: ..., // optional
  monthlyIncomeTargetMinor: ..., // optional
};

// Call the `updateFamilyMemberRef()` function to get a reference to the mutation.
const ref = updateFamilyMemberRef(updateFamilyMemberVars);
// Variables can be defined inline as well.
const ref = updateFamilyMemberRef({ familyMemberId: ..., name: ..., relationship: ..., color: ..., externalAccountRef: ..., monthlyIncomeTargetMinor: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateFamilyMemberRef(dataConnect, updateFamilyMemberVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyMember_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyMember_update);
});
```

## RenameFamilyMember
You can execute the `RenameFamilyMember` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
renameFamilyMember(vars: RenameFamilyMemberVariables): MutationPromise<RenameFamilyMemberData, RenameFamilyMemberVariables>;

interface RenameFamilyMemberRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RenameFamilyMemberVariables): MutationRef<RenameFamilyMemberData, RenameFamilyMemberVariables>;
}
export const renameFamilyMemberRef: RenameFamilyMemberRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
renameFamilyMember(dc: DataConnect, vars: RenameFamilyMemberVariables): MutationPromise<RenameFamilyMemberData, RenameFamilyMemberVariables>;

interface RenameFamilyMemberRef {
  ...
  (dc: DataConnect, vars: RenameFamilyMemberVariables): MutationRef<RenameFamilyMemberData, RenameFamilyMemberVariables>;
}
export const renameFamilyMemberRef: RenameFamilyMemberRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the renameFamilyMemberRef:
```typescript
const name = renameFamilyMemberRef.operationName;
console.log(name);
```

### Variables
The `RenameFamilyMember` mutation requires an argument of type `RenameFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RenameFamilyMemberVariables {
  familyMemberId: UUIDString;
  name: string;
}
```
### Return Type
Recall that executing the `RenameFamilyMember` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RenameFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RenameFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}
```
### Using `RenameFamilyMember`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, renameFamilyMember, RenameFamilyMemberVariables } from '@financeconnect/generated';

// The `RenameFamilyMember` mutation requires an argument of type `RenameFamilyMemberVariables`:
const renameFamilyMemberVars: RenameFamilyMemberVariables = {
  familyMemberId: ..., 
  name: ..., 
};

// Call the `renameFamilyMember()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await renameFamilyMember(renameFamilyMemberVars);
// Variables can be defined inline as well.
const { data } = await renameFamilyMember({ familyMemberId: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await renameFamilyMember(dataConnect, renameFamilyMemberVars);

console.log(data.familyMember_update);

// Or, you can use the `Promise` API.
renameFamilyMember(renameFamilyMemberVars).then((response) => {
  const data = response.data;
  console.log(data.familyMember_update);
});
```

### Using `RenameFamilyMember`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, renameFamilyMemberRef, RenameFamilyMemberVariables } from '@financeconnect/generated';

// The `RenameFamilyMember` mutation requires an argument of type `RenameFamilyMemberVariables`:
const renameFamilyMemberVars: RenameFamilyMemberVariables = {
  familyMemberId: ..., 
  name: ..., 
};

// Call the `renameFamilyMemberRef()` function to get a reference to the mutation.
const ref = renameFamilyMemberRef(renameFamilyMemberVars);
// Variables can be defined inline as well.
const ref = renameFamilyMemberRef({ familyMemberId: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = renameFamilyMemberRef(dataConnect, renameFamilyMemberVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyMember_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyMember_update);
});
```

## DeleteFamilyMember
You can execute the `DeleteFamilyMember` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteFamilyMember(vars: DeleteFamilyMemberVariables): MutationPromise<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;

interface DeleteFamilyMemberRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFamilyMemberVariables): MutationRef<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;
}
export const deleteFamilyMemberRef: DeleteFamilyMemberRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteFamilyMember(dc: DataConnect, vars: DeleteFamilyMemberVariables): MutationPromise<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;

interface DeleteFamilyMemberRef {
  ...
  (dc: DataConnect, vars: DeleteFamilyMemberVariables): MutationRef<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;
}
export const deleteFamilyMemberRef: DeleteFamilyMemberRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteFamilyMemberRef:
```typescript
const name = deleteFamilyMemberRef.operationName;
console.log(name);
```

### Variables
The `DeleteFamilyMember` mutation requires an argument of type `DeleteFamilyMemberVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteFamilyMemberVariables {
  familyMemberId: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteFamilyMember` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteFamilyMemberData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}
```
### Using `DeleteFamilyMember`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteFamilyMember, DeleteFamilyMemberVariables } from '@financeconnect/generated';

// The `DeleteFamilyMember` mutation requires an argument of type `DeleteFamilyMemberVariables`:
const deleteFamilyMemberVars: DeleteFamilyMemberVariables = {
  familyMemberId: ..., 
};

// Call the `deleteFamilyMember()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteFamilyMember(deleteFamilyMemberVars);
// Variables can be defined inline as well.
const { data } = await deleteFamilyMember({ familyMemberId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteFamilyMember(dataConnect, deleteFamilyMemberVars);

console.log(data.familyMember_update);

// Or, you can use the `Promise` API.
deleteFamilyMember(deleteFamilyMemberVars).then((response) => {
  const data = response.data;
  console.log(data.familyMember_update);
});
```

### Using `DeleteFamilyMember`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteFamilyMemberRef, DeleteFamilyMemberVariables } from '@financeconnect/generated';

// The `DeleteFamilyMember` mutation requires an argument of type `DeleteFamilyMemberVariables`:
const deleteFamilyMemberVars: DeleteFamilyMemberVariables = {
  familyMemberId: ..., 
};

// Call the `deleteFamilyMemberRef()` function to get a reference to the mutation.
const ref = deleteFamilyMemberRef(deleteFamilyMemberVars);
// Variables can be defined inline as well.
const ref = deleteFamilyMemberRef({ familyMemberId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteFamilyMemberRef(dataConnect, deleteFamilyMemberVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyMember_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyMember_update);
});
```

## UpsertCategory
You can execute the `UpsertCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertCategory(vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;

interface UpsertCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
}
export const upsertCategoryRef: UpsertCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertCategory(dc: DataConnect, vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;

interface UpsertCategoryRef {
  ...
  (dc: DataConnect, vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
}
export const upsertCategoryRef: UpsertCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertCategoryRef:
```typescript
const name = upsertCategoryRef.operationName;
console.log(name);
```

### Variables
The `UpsertCategory` mutation requires an argument of type `UpsertCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertCategoryVariables {
  name: string;
  kind?: string;
  parentGroup?: string | null;
  color?: string | null;
}
```
### Return Type
Recall that executing the `UpsertCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertCategoryData {
  category_upsert: Category_Key;
}
```
### Using `UpsertCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertCategory, UpsertCategoryVariables } from '@financeconnect/generated';

// The `UpsertCategory` mutation requires an argument of type `UpsertCategoryVariables`:
const upsertCategoryVars: UpsertCategoryVariables = {
  name: ..., 
  kind: ..., // optional
  parentGroup: ..., // optional
  color: ..., // optional
};

// Call the `upsertCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertCategory(upsertCategoryVars);
// Variables can be defined inline as well.
const { data } = await upsertCategory({ name: ..., kind: ..., parentGroup: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertCategory(dataConnect, upsertCategoryVars);

console.log(data.category_upsert);

// Or, you can use the `Promise` API.
upsertCategory(upsertCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.category_upsert);
});
```

### Using `UpsertCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertCategoryRef, UpsertCategoryVariables } from '@financeconnect/generated';

// The `UpsertCategory` mutation requires an argument of type `UpsertCategoryVariables`:
const upsertCategoryVars: UpsertCategoryVariables = {
  name: ..., 
  kind: ..., // optional
  parentGroup: ..., // optional
  color: ..., // optional
};

// Call the `upsertCategoryRef()` function to get a reference to the mutation.
const ref = upsertCategoryRef(upsertCategoryVars);
// Variables can be defined inline as well.
const ref = upsertCategoryRef({ name: ..., kind: ..., parentGroup: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertCategoryRef(dataConnect, upsertCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_upsert);
});
```

## UpdateCategory
You can execute the `UpdateCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateCategory(vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;

interface UpdateCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
}
export const updateCategoryRef: UpdateCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateCategory(dc: DataConnect, vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;

interface UpdateCategoryRef {
  ...
  (dc: DataConnect, vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
}
export const updateCategoryRef: UpdateCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateCategoryRef:
```typescript
const name = updateCategoryRef.operationName;
console.log(name);
```

### Variables
The `UpdateCategory` mutation requires an argument of type `UpdateCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateCategoryVariables {
  name: string;
  kind: string;
  parentGroup?: string | null;
  color?: string | null;
}
```
### Return Type
Recall that executing the `UpdateCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateCategoryData {
  category_update?: Category_Key | null;
}
```
### Using `UpdateCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateCategory, UpdateCategoryVariables } from '@financeconnect/generated';

// The `UpdateCategory` mutation requires an argument of type `UpdateCategoryVariables`:
const updateCategoryVars: UpdateCategoryVariables = {
  name: ..., 
  kind: ..., 
  parentGroup: ..., // optional
  color: ..., // optional
};

// Call the `updateCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateCategory(updateCategoryVars);
// Variables can be defined inline as well.
const { data } = await updateCategory({ name: ..., kind: ..., parentGroup: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateCategory(dataConnect, updateCategoryVars);

console.log(data.category_update);

// Or, you can use the `Promise` API.
updateCategory(updateCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.category_update);
});
```

### Using `UpdateCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateCategoryRef, UpdateCategoryVariables } from '@financeconnect/generated';

// The `UpdateCategory` mutation requires an argument of type `UpdateCategoryVariables`:
const updateCategoryVars: UpdateCategoryVariables = {
  name: ..., 
  kind: ..., 
  parentGroup: ..., // optional
  color: ..., // optional
};

// Call the `updateCategoryRef()` function to get a reference to the mutation.
const ref = updateCategoryRef(updateCategoryVars);
// Variables can be defined inline as well.
const ref = updateCategoryRef({ name: ..., kind: ..., parentGroup: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateCategoryRef(dataConnect, updateCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_update);
});
```

## CreateTransaction
You can execute the `CreateTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createTransaction(vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;

interface CreateTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
}
export const createTransactionRef: CreateTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTransaction(dc: DataConnect, vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;

interface CreateTransactionRef {
  ...
  (dc: DataConnect, vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
}
export const createTransactionRef: CreateTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTransactionRef:
```typescript
const name = createTransactionRef.operationName;
console.log(name);
```

### Variables
The `CreateTransaction` mutation requires an argument of type `CreateTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTransactionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateTransactionData {
  transaction_insert: Transaction_Key;
}
```
### Using `CreateTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTransaction, CreateTransactionVariables } from '@financeconnect/generated';

// The `CreateTransaction` mutation requires an argument of type `CreateTransactionVariables`:
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

// Call the `createTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTransaction(createTransactionVars);
// Variables can be defined inline as well.
const { data } = await createTransaction({ userId: ..., familyMemberId: ..., amountMinor: ..., direction: ..., occurredOn: ..., createdAt: ..., description: ..., merchant: ..., method: ..., recurrence: ..., categoryName: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTransaction(dataConnect, createTransactionVars);

console.log(data.transaction_insert);

// Or, you can use the `Promise` API.
createTransaction(createTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_insert);
});
```

### Using `CreateTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTransactionRef, CreateTransactionVariables } from '@financeconnect/generated';

// The `CreateTransaction` mutation requires an argument of type `CreateTransactionVariables`:
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

// Call the `createTransactionRef()` function to get a reference to the mutation.
const ref = createTransactionRef(createTransactionVars);
// Variables can be defined inline as well.
const ref = createTransactionRef({ userId: ..., familyMemberId: ..., amountMinor: ..., direction: ..., occurredOn: ..., createdAt: ..., description: ..., merchant: ..., method: ..., recurrence: ..., categoryName: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTransactionRef(dataConnect, createTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_insert);
});
```

## UpdateTransaction
You can execute the `UpdateTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateTransaction(vars: UpdateTransactionVariables): MutationPromise<UpdateTransactionData, UpdateTransactionVariables>;

interface UpdateTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTransactionVariables): MutationRef<UpdateTransactionData, UpdateTransactionVariables>;
}
export const updateTransactionRef: UpdateTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTransaction(dc: DataConnect, vars: UpdateTransactionVariables): MutationPromise<UpdateTransactionData, UpdateTransactionVariables>;

interface UpdateTransactionRef {
  ...
  (dc: DataConnect, vars: UpdateTransactionVariables): MutationRef<UpdateTransactionData, UpdateTransactionVariables>;
}
export const updateTransactionRef: UpdateTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTransactionRef:
```typescript
const name = updateTransactionRef.operationName;
console.log(name);
```

### Variables
The `UpdateTransaction` mutation requires an argument of type `UpdateTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTransactionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateTransactionData {
  transaction_update?: Transaction_Key | null;
}
```
### Using `UpdateTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTransaction, UpdateTransactionVariables } from '@financeconnect/generated';

// The `UpdateTransaction` mutation requires an argument of type `UpdateTransactionVariables`:
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

// Call the `updateTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTransaction(updateTransactionVars);
// Variables can be defined inline as well.
const { data } = await updateTransaction({ transactionId: ..., amountMinor: ..., direction: ..., occurredOn: ..., description: ..., merchant: ..., method: ..., recurrence: ..., categoryName: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTransaction(dataConnect, updateTransactionVars);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
updateTransaction(updateTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

### Using `UpdateTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTransactionRef, UpdateTransactionVariables } from '@financeconnect/generated';

// The `UpdateTransaction` mutation requires an argument of type `UpdateTransactionVariables`:
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

// Call the `updateTransactionRef()` function to get a reference to the mutation.
const ref = updateTransactionRef(updateTransactionVars);
// Variables can be defined inline as well.
const ref = updateTransactionRef({ transactionId: ..., amountMinor: ..., direction: ..., occurredOn: ..., description: ..., merchant: ..., method: ..., recurrence: ..., categoryName: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTransactionRef(dataConnect, updateTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

## UpdateTransactionClearCategory
You can execute the `UpdateTransactionClearCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateTransactionClearCategory(vars: UpdateTransactionClearCategoryVariables): MutationPromise<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;

interface UpdateTransactionClearCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTransactionClearCategoryVariables): MutationRef<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;
}
export const updateTransactionClearCategoryRef: UpdateTransactionClearCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTransactionClearCategory(dc: DataConnect, vars: UpdateTransactionClearCategoryVariables): MutationPromise<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;

interface UpdateTransactionClearCategoryRef {
  ...
  (dc: DataConnect, vars: UpdateTransactionClearCategoryVariables): MutationRef<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;
}
export const updateTransactionClearCategoryRef: UpdateTransactionClearCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTransactionClearCategoryRef:
```typescript
const name = updateTransactionClearCategoryRef.operationName;
console.log(name);
```

### Variables
The `UpdateTransactionClearCategory` mutation requires an argument of type `UpdateTransactionClearCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpdateTransactionClearCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTransactionClearCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateTransactionClearCategoryData {
  transaction_update?: Transaction_Key | null;
}
```
### Using `UpdateTransactionClearCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTransactionClearCategory, UpdateTransactionClearCategoryVariables } from '@financeconnect/generated';

// The `UpdateTransactionClearCategory` mutation requires an argument of type `UpdateTransactionClearCategoryVariables`:
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

// Call the `updateTransactionClearCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTransactionClearCategory(updateTransactionClearCategoryVars);
// Variables can be defined inline as well.
const { data } = await updateTransactionClearCategory({ transactionId: ..., amountMinor: ..., direction: ..., occurredOn: ..., description: ..., merchant: ..., method: ..., recurrence: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTransactionClearCategory(dataConnect, updateTransactionClearCategoryVars);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
updateTransactionClearCategory(updateTransactionClearCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

### Using `UpdateTransactionClearCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTransactionClearCategoryRef, UpdateTransactionClearCategoryVariables } from '@financeconnect/generated';

// The `UpdateTransactionClearCategory` mutation requires an argument of type `UpdateTransactionClearCategoryVariables`:
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

// Call the `updateTransactionClearCategoryRef()` function to get a reference to the mutation.
const ref = updateTransactionClearCategoryRef(updateTransactionClearCategoryVars);
// Variables can be defined inline as well.
const ref = updateTransactionClearCategoryRef({ transactionId: ..., amountMinor: ..., direction: ..., occurredOn: ..., description: ..., merchant: ..., method: ..., recurrence: ..., source: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTransactionClearCategoryRef(dataConnect, updateTransactionClearCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

## MarkTransactionPosted
You can execute the `MarkTransactionPosted` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
markTransactionPosted(vars: MarkTransactionPostedVariables): MutationPromise<MarkTransactionPostedData, MarkTransactionPostedVariables>;

interface MarkTransactionPostedRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkTransactionPostedVariables): MutationRef<MarkTransactionPostedData, MarkTransactionPostedVariables>;
}
export const markTransactionPostedRef: MarkTransactionPostedRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
markTransactionPosted(dc: DataConnect, vars: MarkTransactionPostedVariables): MutationPromise<MarkTransactionPostedData, MarkTransactionPostedVariables>;

interface MarkTransactionPostedRef {
  ...
  (dc: DataConnect, vars: MarkTransactionPostedVariables): MutationRef<MarkTransactionPostedData, MarkTransactionPostedVariables>;
}
export const markTransactionPostedRef: MarkTransactionPostedRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the markTransactionPostedRef:
```typescript
const name = markTransactionPostedRef.operationName;
console.log(name);
```

### Variables
The `MarkTransactionPosted` mutation requires an argument of type `MarkTransactionPostedVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MarkTransactionPostedVariables {
  transactionId: UUIDString;
}
```
### Return Type
Recall that executing the `MarkTransactionPosted` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MarkTransactionPostedData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MarkTransactionPostedData {
  transaction_update?: Transaction_Key | null;
}
```
### Using `MarkTransactionPosted`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, markTransactionPosted, MarkTransactionPostedVariables } from '@financeconnect/generated';

// The `MarkTransactionPosted` mutation requires an argument of type `MarkTransactionPostedVariables`:
const markTransactionPostedVars: MarkTransactionPostedVariables = {
  transactionId: ..., 
};

// Call the `markTransactionPosted()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await markTransactionPosted(markTransactionPostedVars);
// Variables can be defined inline as well.
const { data } = await markTransactionPosted({ transactionId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await markTransactionPosted(dataConnect, markTransactionPostedVars);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
markTransactionPosted(markTransactionPostedVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

### Using `MarkTransactionPosted`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, markTransactionPostedRef, MarkTransactionPostedVariables } from '@financeconnect/generated';

// The `MarkTransactionPosted` mutation requires an argument of type `MarkTransactionPostedVariables`:
const markTransactionPostedVars: MarkTransactionPostedVariables = {
  transactionId: ..., 
};

// Call the `markTransactionPostedRef()` function to get a reference to the mutation.
const ref = markTransactionPostedRef(markTransactionPostedVars);
// Variables can be defined inline as well.
const ref = markTransactionPostedRef({ transactionId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = markTransactionPostedRef(dataConnect, markTransactionPostedVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

## MarkTransactionProjected
You can execute the `MarkTransactionProjected` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
markTransactionProjected(vars: MarkTransactionProjectedVariables): MutationPromise<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;

interface MarkTransactionProjectedRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkTransactionProjectedVariables): MutationRef<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;
}
export const markTransactionProjectedRef: MarkTransactionProjectedRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
markTransactionProjected(dc: DataConnect, vars: MarkTransactionProjectedVariables): MutationPromise<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;

interface MarkTransactionProjectedRef {
  ...
  (dc: DataConnect, vars: MarkTransactionProjectedVariables): MutationRef<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;
}
export const markTransactionProjectedRef: MarkTransactionProjectedRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the markTransactionProjectedRef:
```typescript
const name = markTransactionProjectedRef.operationName;
console.log(name);
```

### Variables
The `MarkTransactionProjected` mutation requires an argument of type `MarkTransactionProjectedVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MarkTransactionProjectedVariables {
  transactionId: UUIDString;
}
```
### Return Type
Recall that executing the `MarkTransactionProjected` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MarkTransactionProjectedData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MarkTransactionProjectedData {
  transaction_update?: Transaction_Key | null;
}
```
### Using `MarkTransactionProjected`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, markTransactionProjected, MarkTransactionProjectedVariables } from '@financeconnect/generated';

// The `MarkTransactionProjected` mutation requires an argument of type `MarkTransactionProjectedVariables`:
const markTransactionProjectedVars: MarkTransactionProjectedVariables = {
  transactionId: ..., 
};

// Call the `markTransactionProjected()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await markTransactionProjected(markTransactionProjectedVars);
// Variables can be defined inline as well.
const { data } = await markTransactionProjected({ transactionId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await markTransactionProjected(dataConnect, markTransactionProjectedVars);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
markTransactionProjected(markTransactionProjectedVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

### Using `MarkTransactionProjected`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, markTransactionProjectedRef, MarkTransactionProjectedVariables } from '@financeconnect/generated';

// The `MarkTransactionProjected` mutation requires an argument of type `MarkTransactionProjectedVariables`:
const markTransactionProjectedVars: MarkTransactionProjectedVariables = {
  transactionId: ..., 
};

// Call the `markTransactionProjectedRef()` function to get a reference to the mutation.
const ref = markTransactionProjectedRef(markTransactionProjectedVars);
// Variables can be defined inline as well.
const ref = markTransactionProjectedRef({ transactionId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = markTransactionProjectedRef(dataConnect, markTransactionProjectedVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_update);
});
```

## DeleteTransaction
You can execute the `DeleteTransaction` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteTransaction(vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface DeleteTransactionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
}
export const deleteTransactionRef: DeleteTransactionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteTransaction(dc: DataConnect, vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface DeleteTransactionRef {
  ...
  (dc: DataConnect, vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
}
export const deleteTransactionRef: DeleteTransactionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteTransactionRef:
```typescript
const name = deleteTransactionRef.operationName;
console.log(name);
```

### Variables
The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteTransactionVariables {
  transactionId: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteTransaction` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteTransactionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteTransactionData {
  transaction_delete?: Transaction_Key | null;
}
```
### Using `DeleteTransaction`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteTransaction, DeleteTransactionVariables } from '@financeconnect/generated';

// The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`:
const deleteTransactionVars: DeleteTransactionVariables = {
  transactionId: ..., 
};

// Call the `deleteTransaction()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteTransaction(deleteTransactionVars);
// Variables can be defined inline as well.
const { data } = await deleteTransaction({ transactionId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteTransaction(dataConnect, deleteTransactionVars);

console.log(data.transaction_delete);

// Or, you can use the `Promise` API.
deleteTransaction(deleteTransactionVars).then((response) => {
  const data = response.data;
  console.log(data.transaction_delete);
});
```

### Using `DeleteTransaction`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteTransactionRef, DeleteTransactionVariables } from '@financeconnect/generated';

// The `DeleteTransaction` mutation requires an argument of type `DeleteTransactionVariables`:
const deleteTransactionVars: DeleteTransactionVariables = {
  transactionId: ..., 
};

// Call the `deleteTransactionRef()` function to get a reference to the mutation.
const ref = deleteTransactionRef(deleteTransactionVars);
// Variables can be defined inline as well.
const ref = deleteTransactionRef({ transactionId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteTransactionRef(dataConnect, deleteTransactionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.transaction_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.transaction_delete);
});
```

## CreateFamily
You can execute the `CreateFamily` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createFamily(vars: CreateFamilyVariables): MutationPromise<CreateFamilyData, CreateFamilyVariables>;

interface CreateFamilyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateFamilyVariables): MutationRef<CreateFamilyData, CreateFamilyVariables>;
}
export const createFamilyRef: CreateFamilyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createFamily(dc: DataConnect, vars: CreateFamilyVariables): MutationPromise<CreateFamilyData, CreateFamilyVariables>;

interface CreateFamilyRef {
  ...
  (dc: DataConnect, vars: CreateFamilyVariables): MutationRef<CreateFamilyData, CreateFamilyVariables>;
}
export const createFamilyRef: CreateFamilyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createFamilyRef:
```typescript
const name = createFamilyRef.operationName;
console.log(name);
```

### Variables
The `CreateFamily` mutation requires an argument of type `CreateFamilyVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateFamilyVariables {
  userId: UUIDString;
  familyId: UUIDString;
  name: string;
  inviteCode: string;
}
```
### Return Type
Recall that executing the `CreateFamily` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateFamilyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateFamilyData {
  family_insert: Family_Key;
  user_update?: User_Key | null;
}
```
### Using `CreateFamily`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createFamily, CreateFamilyVariables } from '@financeconnect/generated';

// The `CreateFamily` mutation requires an argument of type `CreateFamilyVariables`:
const createFamilyVars: CreateFamilyVariables = {
  userId: ..., 
  familyId: ..., 
  name: ..., 
  inviteCode: ..., 
};

// Call the `createFamily()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createFamily(createFamilyVars);
// Variables can be defined inline as well.
const { data } = await createFamily({ userId: ..., familyId: ..., name: ..., inviteCode: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createFamily(dataConnect, createFamilyVars);

console.log(data.family_insert);
console.log(data.user_update);

// Or, you can use the `Promise` API.
createFamily(createFamilyVars).then((response) => {
  const data = response.data;
  console.log(data.family_insert);
  console.log(data.user_update);
});
```

### Using `CreateFamily`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createFamilyRef, CreateFamilyVariables } from '@financeconnect/generated';

// The `CreateFamily` mutation requires an argument of type `CreateFamilyVariables`:
const createFamilyVars: CreateFamilyVariables = {
  userId: ..., 
  familyId: ..., 
  name: ..., 
  inviteCode: ..., 
};

// Call the `createFamilyRef()` function to get a reference to the mutation.
const ref = createFamilyRef(createFamilyVars);
// Variables can be defined inline as well.
const ref = createFamilyRef({ userId: ..., familyId: ..., name: ..., inviteCode: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createFamilyRef(dataConnect, createFamilyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.family_insert);
console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.family_insert);
  console.log(data.user_update);
});
```

## RequestToJoinFamily
You can execute the `RequestToJoinFamily` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
requestToJoinFamily(vars: RequestToJoinFamilyVariables): MutationPromise<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;

interface RequestToJoinFamilyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RequestToJoinFamilyVariables): MutationRef<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;
}
export const requestToJoinFamilyRef: RequestToJoinFamilyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
requestToJoinFamily(dc: DataConnect, vars: RequestToJoinFamilyVariables): MutationPromise<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;

interface RequestToJoinFamilyRef {
  ...
  (dc: DataConnect, vars: RequestToJoinFamilyVariables): MutationRef<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;
}
export const requestToJoinFamilyRef: RequestToJoinFamilyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the requestToJoinFamilyRef:
```typescript
const name = requestToJoinFamilyRef.operationName;
console.log(name);
```

### Variables
The `RequestToJoinFamily` mutation requires an argument of type `RequestToJoinFamilyVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RequestToJoinFamilyVariables {
  userId: UUIDString;
  familyId: UUIDString;
}
```
### Return Type
Recall that executing the `RequestToJoinFamily` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RequestToJoinFamilyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RequestToJoinFamilyData {
  familyJoinRequest_upsert: FamilyJoinRequest_Key;
}
```
### Using `RequestToJoinFamily`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, requestToJoinFamily, RequestToJoinFamilyVariables } from '@financeconnect/generated';

// The `RequestToJoinFamily` mutation requires an argument of type `RequestToJoinFamilyVariables`:
const requestToJoinFamilyVars: RequestToJoinFamilyVariables = {
  userId: ..., 
  familyId: ..., 
};

// Call the `requestToJoinFamily()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await requestToJoinFamily(requestToJoinFamilyVars);
// Variables can be defined inline as well.
const { data } = await requestToJoinFamily({ userId: ..., familyId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await requestToJoinFamily(dataConnect, requestToJoinFamilyVars);

console.log(data.familyJoinRequest_upsert);

// Or, you can use the `Promise` API.
requestToJoinFamily(requestToJoinFamilyVars).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_upsert);
});
```

### Using `RequestToJoinFamily`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, requestToJoinFamilyRef, RequestToJoinFamilyVariables } from '@financeconnect/generated';

// The `RequestToJoinFamily` mutation requires an argument of type `RequestToJoinFamilyVariables`:
const requestToJoinFamilyVars: RequestToJoinFamilyVariables = {
  userId: ..., 
  familyId: ..., 
};

// Call the `requestToJoinFamilyRef()` function to get a reference to the mutation.
const ref = requestToJoinFamilyRef(requestToJoinFamilyVars);
// Variables can be defined inline as well.
const ref = requestToJoinFamilyRef({ userId: ..., familyId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = requestToJoinFamilyRef(dataConnect, requestToJoinFamilyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyJoinRequest_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_upsert);
});
```

## ApproveJoinRequest
You can execute the `ApproveJoinRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
approveJoinRequest(vars: ApproveJoinRequestVariables): MutationPromise<ApproveJoinRequestData, ApproveJoinRequestVariables>;

interface ApproveJoinRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApproveJoinRequestVariables): MutationRef<ApproveJoinRequestData, ApproveJoinRequestVariables>;
}
export const approveJoinRequestRef: ApproveJoinRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
approveJoinRequest(dc: DataConnect, vars: ApproveJoinRequestVariables): MutationPromise<ApproveJoinRequestData, ApproveJoinRequestVariables>;

interface ApproveJoinRequestRef {
  ...
  (dc: DataConnect, vars: ApproveJoinRequestVariables): MutationRef<ApproveJoinRequestData, ApproveJoinRequestVariables>;
}
export const approveJoinRequestRef: ApproveJoinRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the approveJoinRequestRef:
```typescript
const name = approveJoinRequestRef.operationName;
console.log(name);
```

### Variables
The `ApproveJoinRequest` mutation requires an argument of type `ApproveJoinRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ApproveJoinRequestVariables {
  familyId: UUIDString;
  requesterId: UUIDString;
}
```
### Return Type
Recall that executing the `ApproveJoinRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ApproveJoinRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ApproveJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
  user_update?: User_Key | null;
}
```
### Using `ApproveJoinRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, approveJoinRequest, ApproveJoinRequestVariables } from '@financeconnect/generated';

// The `ApproveJoinRequest` mutation requires an argument of type `ApproveJoinRequestVariables`:
const approveJoinRequestVars: ApproveJoinRequestVariables = {
  familyId: ..., 
  requesterId: ..., 
};

// Call the `approveJoinRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await approveJoinRequest(approveJoinRequestVars);
// Variables can be defined inline as well.
const { data } = await approveJoinRequest({ familyId: ..., requesterId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await approveJoinRequest(dataConnect, approveJoinRequestVars);

console.log(data.familyJoinRequest_update);
console.log(data.user_update);

// Or, you can use the `Promise` API.
approveJoinRequest(approveJoinRequestVars).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_update);
  console.log(data.user_update);
});
```

### Using `ApproveJoinRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, approveJoinRequestRef, ApproveJoinRequestVariables } from '@financeconnect/generated';

// The `ApproveJoinRequest` mutation requires an argument of type `ApproveJoinRequestVariables`:
const approveJoinRequestVars: ApproveJoinRequestVariables = {
  familyId: ..., 
  requesterId: ..., 
};

// Call the `approveJoinRequestRef()` function to get a reference to the mutation.
const ref = approveJoinRequestRef(approveJoinRequestVars);
// Variables can be defined inline as well.
const ref = approveJoinRequestRef({ familyId: ..., requesterId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = approveJoinRequestRef(dataConnect, approveJoinRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyJoinRequest_update);
console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_update);
  console.log(data.user_update);
});
```

## DenyJoinRequest
You can execute the `DenyJoinRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
denyJoinRequest(vars: DenyJoinRequestVariables): MutationPromise<DenyJoinRequestData, DenyJoinRequestVariables>;

interface DenyJoinRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DenyJoinRequestVariables): MutationRef<DenyJoinRequestData, DenyJoinRequestVariables>;
}
export const denyJoinRequestRef: DenyJoinRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
denyJoinRequest(dc: DataConnect, vars: DenyJoinRequestVariables): MutationPromise<DenyJoinRequestData, DenyJoinRequestVariables>;

interface DenyJoinRequestRef {
  ...
  (dc: DataConnect, vars: DenyJoinRequestVariables): MutationRef<DenyJoinRequestData, DenyJoinRequestVariables>;
}
export const denyJoinRequestRef: DenyJoinRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the denyJoinRequestRef:
```typescript
const name = denyJoinRequestRef.operationName;
console.log(name);
```

### Variables
The `DenyJoinRequest` mutation requires an argument of type `DenyJoinRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DenyJoinRequestVariables {
  familyId: UUIDString;
  requesterId: UUIDString;
}
```
### Return Type
Recall that executing the `DenyJoinRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DenyJoinRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DenyJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
}
```
### Using `DenyJoinRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, denyJoinRequest, DenyJoinRequestVariables } from '@financeconnect/generated';

// The `DenyJoinRequest` mutation requires an argument of type `DenyJoinRequestVariables`:
const denyJoinRequestVars: DenyJoinRequestVariables = {
  familyId: ..., 
  requesterId: ..., 
};

// Call the `denyJoinRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await denyJoinRequest(denyJoinRequestVars);
// Variables can be defined inline as well.
const { data } = await denyJoinRequest({ familyId: ..., requesterId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await denyJoinRequest(dataConnect, denyJoinRequestVars);

console.log(data.familyJoinRequest_update);

// Or, you can use the `Promise` API.
denyJoinRequest(denyJoinRequestVars).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_update);
});
```

### Using `DenyJoinRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, denyJoinRequestRef, DenyJoinRequestVariables } from '@financeconnect/generated';

// The `DenyJoinRequest` mutation requires an argument of type `DenyJoinRequestVariables`:
const denyJoinRequestVars: DenyJoinRequestVariables = {
  familyId: ..., 
  requesterId: ..., 
};

// Call the `denyJoinRequestRef()` function to get a reference to the mutation.
const ref = denyJoinRequestRef(denyJoinRequestVars);
// Variables can be defined inline as well.
const ref = denyJoinRequestRef({ familyId: ..., requesterId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = denyJoinRequestRef(dataConnect, denyJoinRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyJoinRequest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_update);
});
```

## CancelMyJoinRequest
You can execute the `CancelMyJoinRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
cancelMyJoinRequest(vars: CancelMyJoinRequestVariables): MutationPromise<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;

interface CancelMyJoinRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelMyJoinRequestVariables): MutationRef<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;
}
export const cancelMyJoinRequestRef: CancelMyJoinRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
cancelMyJoinRequest(dc: DataConnect, vars: CancelMyJoinRequestVariables): MutationPromise<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;

interface CancelMyJoinRequestRef {
  ...
  (dc: DataConnect, vars: CancelMyJoinRequestVariables): MutationRef<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;
}
export const cancelMyJoinRequestRef: CancelMyJoinRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the cancelMyJoinRequestRef:
```typescript
const name = cancelMyJoinRequestRef.operationName;
console.log(name);
```

### Variables
The `CancelMyJoinRequest` mutation requires an argument of type `CancelMyJoinRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CancelMyJoinRequestVariables {
  familyId: UUIDString;
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `CancelMyJoinRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CancelMyJoinRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CancelMyJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
}
```
### Using `CancelMyJoinRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, cancelMyJoinRequest, CancelMyJoinRequestVariables } from '@financeconnect/generated';

// The `CancelMyJoinRequest` mutation requires an argument of type `CancelMyJoinRequestVariables`:
const cancelMyJoinRequestVars: CancelMyJoinRequestVariables = {
  familyId: ..., 
  userId: ..., 
};

// Call the `cancelMyJoinRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await cancelMyJoinRequest(cancelMyJoinRequestVars);
// Variables can be defined inline as well.
const { data } = await cancelMyJoinRequest({ familyId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await cancelMyJoinRequest(dataConnect, cancelMyJoinRequestVars);

console.log(data.familyJoinRequest_update);

// Or, you can use the `Promise` API.
cancelMyJoinRequest(cancelMyJoinRequestVars).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_update);
});
```

### Using `CancelMyJoinRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, cancelMyJoinRequestRef, CancelMyJoinRequestVariables } from '@financeconnect/generated';

// The `CancelMyJoinRequest` mutation requires an argument of type `CancelMyJoinRequestVariables`:
const cancelMyJoinRequestVars: CancelMyJoinRequestVariables = {
  familyId: ..., 
  userId: ..., 
};

// Call the `cancelMyJoinRequestRef()` function to get a reference to the mutation.
const ref = cancelMyJoinRequestRef(cancelMyJoinRequestVars);
// Variables can be defined inline as well.
const ref = cancelMyJoinRequestRef({ familyId: ..., userId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = cancelMyJoinRequestRef(dataConnect, cancelMyJoinRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.familyJoinRequest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.familyJoinRequest_update);
});
```

## LeaveMyFamily
You can execute the `LeaveMyFamily` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
leaveMyFamily(vars: LeaveMyFamilyVariables): MutationPromise<LeaveMyFamilyData, LeaveMyFamilyVariables>;

interface LeaveMyFamilyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: LeaveMyFamilyVariables): MutationRef<LeaveMyFamilyData, LeaveMyFamilyVariables>;
}
export const leaveMyFamilyRef: LeaveMyFamilyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
leaveMyFamily(dc: DataConnect, vars: LeaveMyFamilyVariables): MutationPromise<LeaveMyFamilyData, LeaveMyFamilyVariables>;

interface LeaveMyFamilyRef {
  ...
  (dc: DataConnect, vars: LeaveMyFamilyVariables): MutationRef<LeaveMyFamilyData, LeaveMyFamilyVariables>;
}
export const leaveMyFamilyRef: LeaveMyFamilyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the leaveMyFamilyRef:
```typescript
const name = leaveMyFamilyRef.operationName;
console.log(name);
```

### Variables
The `LeaveMyFamily` mutation requires an argument of type `LeaveMyFamilyVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface LeaveMyFamilyVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `LeaveMyFamily` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `LeaveMyFamilyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface LeaveMyFamilyData {
  user_update?: User_Key | null;
}
```
### Using `LeaveMyFamily`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, leaveMyFamily, LeaveMyFamilyVariables } from '@financeconnect/generated';

// The `LeaveMyFamily` mutation requires an argument of type `LeaveMyFamilyVariables`:
const leaveMyFamilyVars: LeaveMyFamilyVariables = {
  userId: ..., 
};

// Call the `leaveMyFamily()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await leaveMyFamily(leaveMyFamilyVars);
// Variables can be defined inline as well.
const { data } = await leaveMyFamily({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await leaveMyFamily(dataConnect, leaveMyFamilyVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
leaveMyFamily(leaveMyFamilyVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `LeaveMyFamily`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, leaveMyFamilyRef, LeaveMyFamilyVariables } from '@financeconnect/generated';

// The `LeaveMyFamily` mutation requires an argument of type `LeaveMyFamilyVariables`:
const leaveMyFamilyVars: LeaveMyFamilyVariables = {
  userId: ..., 
};

// Call the `leaveMyFamilyRef()` function to get a reference to the mutation.
const ref = leaveMyFamilyRef(leaveMyFamilyVars);
// Variables can be defined inline as well.
const ref = leaveMyFamilyRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = leaveMyFamilyRef(dataConnect, leaveMyFamilyVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## RegenerateFamilyInviteCode
You can execute the `RegenerateFamilyInviteCode` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
regenerateFamilyInviteCode(vars: RegenerateFamilyInviteCodeVariables): MutationPromise<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;

interface RegenerateFamilyInviteCodeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegenerateFamilyInviteCodeVariables): MutationRef<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;
}
export const regenerateFamilyInviteCodeRef: RegenerateFamilyInviteCodeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
regenerateFamilyInviteCode(dc: DataConnect, vars: RegenerateFamilyInviteCodeVariables): MutationPromise<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;

interface RegenerateFamilyInviteCodeRef {
  ...
  (dc: DataConnect, vars: RegenerateFamilyInviteCodeVariables): MutationRef<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;
}
export const regenerateFamilyInviteCodeRef: RegenerateFamilyInviteCodeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the regenerateFamilyInviteCodeRef:
```typescript
const name = regenerateFamilyInviteCodeRef.operationName;
console.log(name);
```

### Variables
The `RegenerateFamilyInviteCode` mutation requires an argument of type `RegenerateFamilyInviteCodeVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface RegenerateFamilyInviteCodeVariables {
  familyId: UUIDString;
  inviteCode: string;
}
```
### Return Type
Recall that executing the `RegenerateFamilyInviteCode` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `RegenerateFamilyInviteCodeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface RegenerateFamilyInviteCodeData {
  family_update?: Family_Key | null;
}
```
### Using `RegenerateFamilyInviteCode`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, regenerateFamilyInviteCode, RegenerateFamilyInviteCodeVariables } from '@financeconnect/generated';

// The `RegenerateFamilyInviteCode` mutation requires an argument of type `RegenerateFamilyInviteCodeVariables`:
const regenerateFamilyInviteCodeVars: RegenerateFamilyInviteCodeVariables = {
  familyId: ..., 
  inviteCode: ..., 
};

// Call the `regenerateFamilyInviteCode()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await regenerateFamilyInviteCode(regenerateFamilyInviteCodeVars);
// Variables can be defined inline as well.
const { data } = await regenerateFamilyInviteCode({ familyId: ..., inviteCode: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await regenerateFamilyInviteCode(dataConnect, regenerateFamilyInviteCodeVars);

console.log(data.family_update);

// Or, you can use the `Promise` API.
regenerateFamilyInviteCode(regenerateFamilyInviteCodeVars).then((response) => {
  const data = response.data;
  console.log(data.family_update);
});
```

### Using `RegenerateFamilyInviteCode`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, regenerateFamilyInviteCodeRef, RegenerateFamilyInviteCodeVariables } from '@financeconnect/generated';

// The `RegenerateFamilyInviteCode` mutation requires an argument of type `RegenerateFamilyInviteCodeVariables`:
const regenerateFamilyInviteCodeVars: RegenerateFamilyInviteCodeVariables = {
  familyId: ..., 
  inviteCode: ..., 
};

// Call the `regenerateFamilyInviteCodeRef()` function to get a reference to the mutation.
const ref = regenerateFamilyInviteCodeRef(regenerateFamilyInviteCodeVars);
// Variables can be defined inline as well.
const ref = regenerateFamilyInviteCodeRef({ familyId: ..., inviteCode: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = regenerateFamilyInviteCodeRef(dataConnect, regenerateFamilyInviteCodeVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.family_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.family_update);
});
```

## CreateUserSettingForUser
You can execute the `CreateUserSettingForUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUserSettingForUser(vars: CreateUserSettingForUserVariables): MutationPromise<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;

interface CreateUserSettingForUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserSettingForUserVariables): MutationRef<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;
}
export const createUserSettingForUserRef: CreateUserSettingForUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUserSettingForUser(dc: DataConnect, vars: CreateUserSettingForUserVariables): MutationPromise<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;

interface CreateUserSettingForUserRef {
  ...
  (dc: DataConnect, vars: CreateUserSettingForUserVariables): MutationRef<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;
}
export const createUserSettingForUserRef: CreateUserSettingForUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserSettingForUserRef:
```typescript
const name = createUserSettingForUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUserSettingForUser` mutation requires an argument of type `CreateUserSettingForUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserSettingForUserVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateUserSettingForUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserSettingForUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserSettingForUserData {
  userSetting_insert: UserSetting_Key;
}
```
### Using `CreateUserSettingForUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUserSettingForUser, CreateUserSettingForUserVariables } from '@financeconnect/generated';

// The `CreateUserSettingForUser` mutation requires an argument of type `CreateUserSettingForUserVariables`:
const createUserSettingForUserVars: CreateUserSettingForUserVariables = {
  userId: ..., 
};

// Call the `createUserSettingForUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUserSettingForUser(createUserSettingForUserVars);
// Variables can be defined inline as well.
const { data } = await createUserSettingForUser({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUserSettingForUser(dataConnect, createUserSettingForUserVars);

console.log(data.userSetting_insert);

// Or, you can use the `Promise` API.
createUserSettingForUser(createUserSettingForUserVars).then((response) => {
  const data = response.data;
  console.log(data.userSetting_insert);
});
```

### Using `CreateUserSettingForUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserSettingForUserRef, CreateUserSettingForUserVariables } from '@financeconnect/generated';

// The `CreateUserSettingForUser` mutation requires an argument of type `CreateUserSettingForUserVariables`:
const createUserSettingForUserVars: CreateUserSettingForUserVariables = {
  userId: ..., 
};

// Call the `createUserSettingForUserRef()` function to get a reference to the mutation.
const ref = createUserSettingForUserRef(createUserSettingForUserVars);
// Variables can be defined inline as well.
const ref = createUserSettingForUserRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserSettingForUserRef(dataConnect, createUserSettingForUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userSetting_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userSetting_insert);
});
```

