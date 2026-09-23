import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface ApproveJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
  user_update?: User_Key | null;
}

export interface ApproveJoinRequestVariables {
  familyId: UUIDString;
  requesterId: UUIDString;
}

export interface CancelMyJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
}

export interface CancelMyJoinRequestVariables {
  familyId: UUIDString;
  userId: UUIDString;
}

export interface Category_Key {
  name: string;
  __typename?: 'Category_Key';
}

export interface ClearMyColorSchemeData {
  userSetting_update?: UserSetting_Key | null;
}

export interface ColorScheme_Key {
  id: UUIDString;
  __typename?: 'ColorScheme_Key';
}

export interface CreateFamilyData {
  family_insert: Family_Key;
  user_update?: User_Key | null;
}

export interface CreateFamilyMemberData {
  familyMember_insert: FamilyMember_Key;
}

export interface CreateFamilyMemberVariables {
  userId: UUIDString;
  familyMemberId: UUIDString;
  name: string;
  relationship?: string | null;
  color?: string | null;
  monthlyIncomeTargetMinor?: number | null;
}

export interface CreateFamilyVariables {
  userId: UUIDString;
  familyId: UUIDString;
  name: string;
  inviteCode: string;
}

export interface CreateSelfFamilyMemberForUserData {
  familyMember_insert: FamilyMember_Key;
}

export interface CreateSelfFamilyMemberForUserVariables {
  userId: UUIDString;
  familyMemberId: UUIDString;
  name: string;
}

export interface CreateTransactionData {
  transaction_insert: Transaction_Key;
}

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
  recurrenceEndsOn?: DateString | null;
  categoryName?: string | null;
  source?: string | null;
  status?: string | null;
}

export interface CreateUserFromGoogleData {
  userType_upsert: UserType_Key;
  user_insert: User_Key;
  familyMember_insert: FamilyMember_Key;
}

export interface CreateUserFromGoogleVariables {
  userId: UUIDString;
  selfFamilyMemberId: UUIDString;
  googleUid: string;
  username: string;
  email: string;
  createdAt: TimestampString;
  userTypeName?: string;
}

export interface CreateUserSettingForUserData {
  userSetting_insert: UserSetting_Key;
}

export interface CreateUserSettingForUserVariables {
  userId: UUIDString;
}

export interface DeleteFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}

export interface DeleteFamilyMemberVariables {
  familyMemberId: UUIDString;
}

export interface DeleteTransactionData {
  transaction_delete?: Transaction_Key | null;
}

export interface DeleteTransactionVariables {
  transactionId: UUIDString;
}

export interface DenyJoinRequestData {
  familyJoinRequest_update?: FamilyJoinRequest_Key | null;
}

export interface DenyJoinRequestVariables {
  familyId: UUIDString;
  requesterId: UUIDString;
}

export interface FamilyJoinRequest_Key {
  familyId: UUIDString;
  requesterId: UUIDString;
  __typename?: 'FamilyJoinRequest_Key';
}

export interface FamilyMember_Key {
  id: UUIDString;
  __typename?: 'FamilyMember_Key';
}

export interface Family_Key {
  id: UUIDString;
  __typename?: 'Family_Key';
}

export interface Feature_Key {
  name: string;
  __typename?: 'Feature_Key';
}

export interface GetFamilyByInviteCodeData {
  family?: {
    id: UUIDString;
    name: string;
    ownerUser: {
      username: string;
    };
  } & Family_Key;
}

export interface GetFamilyByInviteCodeVariables {
  inviteCode: string;
}

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

export interface GetUserAccessByGoogleUidVariables {
  googleUid: string;
}

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

export interface GetUserProvisioningByGoogleUidVariables {
  googleUid: string;
}

export interface LeaveMyFamilyData {
  user_update?: User_Key | null;
}

export interface LeaveMyFamilyVariables {
  userId: UUIDString;
}

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

export interface ListCategoriesVariables {
  limit?: number | null;
  offset?: number | null;
}

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

export interface ListFamilyMembersVariables {
  limit?: number | null;
  offset?: number | null;
}

export interface ListMyRecurringProjectionsData {
  transactions: ({
    id: UUIDString;
    amountMinor: number;
    direction: string;
    occurredOn: DateString;
    description?: string | null;
    merchant?: string | null;
    method?: string | null;
    recurrence?: string | null;
    recurrenceEndsOn?: DateString | null;
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

export interface ListMyRecurringProjectionsVariables {
  rangeStart: DateString;
  rangeEnd: DateString;
  limit?: number | null;
  offset?: number | null;
}

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
    recurrenceEndsOn?: DateString | null;
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

export interface ListMyTransactionsByDateRangeVariables {
  startDate: DateString;
  endDate: DateString;
  limit?: number | null;
  offset?: number | null;
}

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
    recurrenceEndsOn?: DateString | null;
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

export interface ListMyTransactionsVariables {
  limit?: number | null;
  offset?: number | null;
}

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
    recurrenceEndsOn?: DateString | null;
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

export interface ListTransactionsByFamilyMemberVariables {
  familyMemberId: UUIDString;
  limit?: number | null;
  offset?: number | null;
}

export interface ListUserTypesData {
  userTypes: ({
    id: UUIDString;
    name: string;
    createdAt: TimestampString;
  } & UserType_Key)[];
}

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

export interface MarkTransactionPostedData {
  transaction_update?: Transaction_Key | null;
}

export interface MarkTransactionPostedVariables {
  transactionId: UUIDString;
}

export interface MarkTransactionProjectedData {
  transaction_update?: Transaction_Key | null;
}

export interface MarkTransactionProjectedVariables {
  transactionId: UUIDString;
}

export interface RegenerateFamilyInviteCodeData {
  family_update?: Family_Key | null;
}

export interface RegenerateFamilyInviteCodeVariables {
  familyId: UUIDString;
  inviteCode: string;
}

export interface RenameFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}

export interface RenameFamilyMemberVariables {
  familyMemberId: UUIDString;
  name: string;
}

export interface RequestToJoinFamilyData {
  familyJoinRequest_upsert: FamilyJoinRequest_Key;
}

export interface RequestToJoinFamilyVariables {
  userId: UUIDString;
  familyId: UUIDString;
}

export interface SelectMyBackgroundOpacityData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyBackgroundOpacityVariables {
  backgroundOpacity: number;
}

export interface SelectMyBordersEnabledData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyBordersEnabledVariables {
  bordersEnabled: boolean;
}

export interface SelectMyCardStyleData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyCardStyleVariables {
  cardOpacity: number;
  cardBlur: number;
}

export interface SelectMyCategoryColorsEnabledData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyCategoryColorsEnabledVariables {
  categoryColorsEnabled: boolean;
}

export interface SelectMyColorSchemeData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyColorSchemeVariables {
  colorSchemeId: UUIDString;
}

export interface SelectMyCurrencyData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyCurrencyVariables {
  currencyCode: string;
}

export interface SelectMyExternalAccountLinkTemplateData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyExternalAccountLinkTemplateVariables {
  externalAccountLinkTemplate?: string | null;
}

export interface SelectMyPerformanceModeData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMyPerformanceModeVariables {
  performanceMode: boolean;
}

export interface SelectMySquareCornersData {
  userSetting_update?: UserSetting_Key | null;
}

export interface SelectMySquareCornersVariables {
  squareCorners: boolean;
}

export interface SetUserTypeData {
  user_update?: User_Key | null;
}

export interface SetUserTypeVariables {
  userId: UUIDString;
  userTypeName: string;
}

export interface Theme_Key {
  id: UUIDString;
  __typename?: 'Theme_Key';
}

export interface Transaction_Key {
  id: UUIDString;
  __typename?: 'Transaction_Key';
}

export interface UpdateCategoryData {
  category_update?: Category_Key | null;
}

export interface UpdateCategoryVariables {
  name: string;
  kind: string;
  parentGroup?: string | null;
  color?: string | null;
}

export interface UpdateFamilyMemberData {
  familyMember_update?: FamilyMember_Key | null;
}

export interface UpdateFamilyMemberVariables {
  familyMemberId: UUIDString;
  name: string;
  relationship?: string | null;
  color?: string | null;
  externalAccountRef?: string | null;
  monthlyIncomeTargetMinor?: number | null;
}

export interface UpdateTransactionClearCategoryData {
  transaction_update?: Transaction_Key | null;
}

export interface UpdateTransactionClearCategoryVariables {
  transactionId: UUIDString;
  amountMinor: number;
  direction: string;
  occurredOn: DateString;
  description?: string | null;
  merchant?: string | null;
  method?: string | null;
  recurrence?: string | null;
  recurrenceEndsOn?: DateString | null;
  source?: string | null;
  status?: string | null;
}

export interface UpdateTransactionData {
  transaction_update?: Transaction_Key | null;
}

export interface UpdateTransactionVariables {
  transactionId: UUIDString;
  amountMinor: number;
  direction: string;
  occurredOn: DateString;
  description?: string | null;
  merchant?: string | null;
  method?: string | null;
  recurrence?: string | null;
  recurrenceEndsOn?: DateString | null;
  categoryName?: string | null;
  source?: string | null;
  status?: string | null;
}

export interface UpsertCategoryData {
  category_upsert: Category_Key;
}

export interface UpsertCategoryVariables {
  name: string;
  kind?: string;
  parentGroup?: string | null;
  color?: string | null;
}

export interface UserSetting_Key {
  id: UUIDString;
  __typename?: 'UserSetting_Key';
}

export interface UserTypeFeature_Key {
  userTypeName: string;
  featureName: string;
  __typename?: 'UserTypeFeature_Key';
}

export interface UserType_Key {
  name: string;
  __typename?: 'UserType_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserFromGoogleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserFromGoogleVariables): MutationRef<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserFromGoogleVariables): MutationRef<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;
  operationName: string;
}
export const createUserFromGoogleRef: CreateUserFromGoogleRef;

export function createUserFromGoogle(vars: CreateUserFromGoogleVariables): MutationPromise<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;
export function createUserFromGoogle(dc: DataConnect, vars: CreateUserFromGoogleVariables): MutationPromise<CreateUserFromGoogleData, CreateUserFromGoogleVariables>;

interface SetUserTypeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SetUserTypeVariables): MutationRef<SetUserTypeData, SetUserTypeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SetUserTypeVariables): MutationRef<SetUserTypeData, SetUserTypeVariables>;
  operationName: string;
}
export const setUserTypeRef: SetUserTypeRef;

export function setUserType(vars: SetUserTypeVariables): MutationPromise<SetUserTypeData, SetUserTypeVariables>;
export function setUserType(dc: DataConnect, vars: SetUserTypeVariables): MutationPromise<SetUserTypeData, SetUserTypeVariables>;

interface SelectMyColorSchemeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyColorSchemeVariables): MutationRef<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMyColorSchemeVariables): MutationRef<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;
  operationName: string;
}
export const selectMyColorSchemeRef: SelectMyColorSchemeRef;

export function selectMyColorScheme(vars: SelectMyColorSchemeVariables): MutationPromise<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;
export function selectMyColorScheme(dc: DataConnect, vars: SelectMyColorSchemeVariables): MutationPromise<SelectMyColorSchemeData, SelectMyColorSchemeVariables>;

interface ClearMyColorSchemeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<ClearMyColorSchemeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<ClearMyColorSchemeData, undefined>;
  operationName: string;
}
export const clearMyColorSchemeRef: ClearMyColorSchemeRef;

export function clearMyColorScheme(): MutationPromise<ClearMyColorSchemeData, undefined>;
export function clearMyColorScheme(dc: DataConnect): MutationPromise<ClearMyColorSchemeData, undefined>;

interface SelectMyPerformanceModeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyPerformanceModeVariables): MutationRef<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMyPerformanceModeVariables): MutationRef<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;
  operationName: string;
}
export const selectMyPerformanceModeRef: SelectMyPerformanceModeRef;

export function selectMyPerformanceMode(vars: SelectMyPerformanceModeVariables): MutationPromise<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;
export function selectMyPerformanceMode(dc: DataConnect, vars: SelectMyPerformanceModeVariables): MutationPromise<SelectMyPerformanceModeData, SelectMyPerformanceModeVariables>;

interface SelectMyBackgroundOpacityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyBackgroundOpacityVariables): MutationRef<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMyBackgroundOpacityVariables): MutationRef<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;
  operationName: string;
}
export const selectMyBackgroundOpacityRef: SelectMyBackgroundOpacityRef;

export function selectMyBackgroundOpacity(vars: SelectMyBackgroundOpacityVariables): MutationPromise<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;
export function selectMyBackgroundOpacity(dc: DataConnect, vars: SelectMyBackgroundOpacityVariables): MutationPromise<SelectMyBackgroundOpacityData, SelectMyBackgroundOpacityVariables>;

interface SelectMyExternalAccountLinkTemplateRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: SelectMyExternalAccountLinkTemplateVariables): MutationRef<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: SelectMyExternalAccountLinkTemplateVariables): MutationRef<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;
  operationName: string;
}
export const selectMyExternalAccountLinkTemplateRef: SelectMyExternalAccountLinkTemplateRef;

export function selectMyExternalAccountLinkTemplate(vars?: SelectMyExternalAccountLinkTemplateVariables): MutationPromise<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;
export function selectMyExternalAccountLinkTemplate(dc: DataConnect, vars?: SelectMyExternalAccountLinkTemplateVariables): MutationPromise<SelectMyExternalAccountLinkTemplateData, SelectMyExternalAccountLinkTemplateVariables>;

interface SelectMyCardStyleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyCardStyleVariables): MutationRef<SelectMyCardStyleData, SelectMyCardStyleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMyCardStyleVariables): MutationRef<SelectMyCardStyleData, SelectMyCardStyleVariables>;
  operationName: string;
}
export const selectMyCardStyleRef: SelectMyCardStyleRef;

export function selectMyCardStyle(vars: SelectMyCardStyleVariables): MutationPromise<SelectMyCardStyleData, SelectMyCardStyleVariables>;
export function selectMyCardStyle(dc: DataConnect, vars: SelectMyCardStyleVariables): MutationPromise<SelectMyCardStyleData, SelectMyCardStyleVariables>;

interface SelectMySquareCornersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMySquareCornersVariables): MutationRef<SelectMySquareCornersData, SelectMySquareCornersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMySquareCornersVariables): MutationRef<SelectMySquareCornersData, SelectMySquareCornersVariables>;
  operationName: string;
}
export const selectMySquareCornersRef: SelectMySquareCornersRef;

export function selectMySquareCorners(vars: SelectMySquareCornersVariables): MutationPromise<SelectMySquareCornersData, SelectMySquareCornersVariables>;
export function selectMySquareCorners(dc: DataConnect, vars: SelectMySquareCornersVariables): MutationPromise<SelectMySquareCornersData, SelectMySquareCornersVariables>;

interface SelectMyBordersEnabledRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyBordersEnabledVariables): MutationRef<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMyBordersEnabledVariables): MutationRef<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;
  operationName: string;
}
export const selectMyBordersEnabledRef: SelectMyBordersEnabledRef;

export function selectMyBordersEnabled(vars: SelectMyBordersEnabledVariables): MutationPromise<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;
export function selectMyBordersEnabled(dc: DataConnect, vars: SelectMyBordersEnabledVariables): MutationPromise<SelectMyBordersEnabledData, SelectMyBordersEnabledVariables>;

interface SelectMyCategoryColorsEnabledRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyCategoryColorsEnabledVariables): MutationRef<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMyCategoryColorsEnabledVariables): MutationRef<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;
  operationName: string;
}
export const selectMyCategoryColorsEnabledRef: SelectMyCategoryColorsEnabledRef;

export function selectMyCategoryColorsEnabled(vars: SelectMyCategoryColorsEnabledVariables): MutationPromise<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;
export function selectMyCategoryColorsEnabled(dc: DataConnect, vars: SelectMyCategoryColorsEnabledVariables): MutationPromise<SelectMyCategoryColorsEnabledData, SelectMyCategoryColorsEnabledVariables>;

interface SelectMyCurrencyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SelectMyCurrencyVariables): MutationRef<SelectMyCurrencyData, SelectMyCurrencyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SelectMyCurrencyVariables): MutationRef<SelectMyCurrencyData, SelectMyCurrencyVariables>;
  operationName: string;
}
export const selectMyCurrencyRef: SelectMyCurrencyRef;

export function selectMyCurrency(vars: SelectMyCurrencyVariables): MutationPromise<SelectMyCurrencyData, SelectMyCurrencyVariables>;
export function selectMyCurrency(dc: DataConnect, vars: SelectMyCurrencyVariables): MutationPromise<SelectMyCurrencyData, SelectMyCurrencyVariables>;

interface CreateFamilyMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateFamilyMemberVariables): MutationRef<CreateFamilyMemberData, CreateFamilyMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateFamilyMemberVariables): MutationRef<CreateFamilyMemberData, CreateFamilyMemberVariables>;
  operationName: string;
}
export const createFamilyMemberRef: CreateFamilyMemberRef;

export function createFamilyMember(vars: CreateFamilyMemberVariables): MutationPromise<CreateFamilyMemberData, CreateFamilyMemberVariables>;
export function createFamilyMember(dc: DataConnect, vars: CreateFamilyMemberVariables): MutationPromise<CreateFamilyMemberData, CreateFamilyMemberVariables>;

interface UpdateFamilyMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateFamilyMemberVariables): MutationRef<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateFamilyMemberVariables): MutationRef<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;
  operationName: string;
}
export const updateFamilyMemberRef: UpdateFamilyMemberRef;

export function updateFamilyMember(vars: UpdateFamilyMemberVariables): MutationPromise<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;
export function updateFamilyMember(dc: DataConnect, vars: UpdateFamilyMemberVariables): MutationPromise<UpdateFamilyMemberData, UpdateFamilyMemberVariables>;

interface RenameFamilyMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RenameFamilyMemberVariables): MutationRef<RenameFamilyMemberData, RenameFamilyMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RenameFamilyMemberVariables): MutationRef<RenameFamilyMemberData, RenameFamilyMemberVariables>;
  operationName: string;
}
export const renameFamilyMemberRef: RenameFamilyMemberRef;

export function renameFamilyMember(vars: RenameFamilyMemberVariables): MutationPromise<RenameFamilyMemberData, RenameFamilyMemberVariables>;
export function renameFamilyMember(dc: DataConnect, vars: RenameFamilyMemberVariables): MutationPromise<RenameFamilyMemberData, RenameFamilyMemberVariables>;

interface DeleteFamilyMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteFamilyMemberVariables): MutationRef<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteFamilyMemberVariables): MutationRef<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;
  operationName: string;
}
export const deleteFamilyMemberRef: DeleteFamilyMemberRef;

export function deleteFamilyMember(vars: DeleteFamilyMemberVariables): MutationPromise<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;
export function deleteFamilyMember(dc: DataConnect, vars: DeleteFamilyMemberVariables): MutationPromise<DeleteFamilyMemberData, DeleteFamilyMemberVariables>;

interface UpsertCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
  operationName: string;
}
export const upsertCategoryRef: UpsertCategoryRef;

export function upsertCategory(vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;
export function upsertCategory(dc: DataConnect, vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;

interface UpdateCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateCategoryVariables): MutationRef<UpdateCategoryData, UpdateCategoryVariables>;
  operationName: string;
}
export const updateCategoryRef: UpdateCategoryRef;

export function updateCategory(vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;
export function updateCategory(dc: DataConnect, vars: UpdateCategoryVariables): MutationPromise<UpdateCategoryData, UpdateCategoryVariables>;

interface CreateTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTransactionVariables): MutationRef<CreateTransactionData, CreateTransactionVariables>;
  operationName: string;
}
export const createTransactionRef: CreateTransactionRef;

export function createTransaction(vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;
export function createTransaction(dc: DataConnect, vars: CreateTransactionVariables): MutationPromise<CreateTransactionData, CreateTransactionVariables>;

interface UpdateTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTransactionVariables): MutationRef<UpdateTransactionData, UpdateTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTransactionVariables): MutationRef<UpdateTransactionData, UpdateTransactionVariables>;
  operationName: string;
}
export const updateTransactionRef: UpdateTransactionRef;

export function updateTransaction(vars: UpdateTransactionVariables): MutationPromise<UpdateTransactionData, UpdateTransactionVariables>;
export function updateTransaction(dc: DataConnect, vars: UpdateTransactionVariables): MutationPromise<UpdateTransactionData, UpdateTransactionVariables>;

interface UpdateTransactionClearCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTransactionClearCategoryVariables): MutationRef<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTransactionClearCategoryVariables): MutationRef<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;
  operationName: string;
}
export const updateTransactionClearCategoryRef: UpdateTransactionClearCategoryRef;

export function updateTransactionClearCategory(vars: UpdateTransactionClearCategoryVariables): MutationPromise<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;
export function updateTransactionClearCategory(dc: DataConnect, vars: UpdateTransactionClearCategoryVariables): MutationPromise<UpdateTransactionClearCategoryData, UpdateTransactionClearCategoryVariables>;

interface MarkTransactionPostedRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkTransactionPostedVariables): MutationRef<MarkTransactionPostedData, MarkTransactionPostedVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MarkTransactionPostedVariables): MutationRef<MarkTransactionPostedData, MarkTransactionPostedVariables>;
  operationName: string;
}
export const markTransactionPostedRef: MarkTransactionPostedRef;

export function markTransactionPosted(vars: MarkTransactionPostedVariables): MutationPromise<MarkTransactionPostedData, MarkTransactionPostedVariables>;
export function markTransactionPosted(dc: DataConnect, vars: MarkTransactionPostedVariables): MutationPromise<MarkTransactionPostedData, MarkTransactionPostedVariables>;

interface MarkTransactionProjectedRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkTransactionProjectedVariables): MutationRef<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MarkTransactionProjectedVariables): MutationRef<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;
  operationName: string;
}
export const markTransactionProjectedRef: MarkTransactionProjectedRef;

export function markTransactionProjected(vars: MarkTransactionProjectedVariables): MutationPromise<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;
export function markTransactionProjected(dc: DataConnect, vars: MarkTransactionProjectedVariables): MutationPromise<MarkTransactionProjectedData, MarkTransactionProjectedVariables>;

interface DeleteTransactionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteTransactionVariables): MutationRef<DeleteTransactionData, DeleteTransactionVariables>;
  operationName: string;
}
export const deleteTransactionRef: DeleteTransactionRef;

export function deleteTransaction(vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;
export function deleteTransaction(dc: DataConnect, vars: DeleteTransactionVariables): MutationPromise<DeleteTransactionData, DeleteTransactionVariables>;

interface CreateFamilyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateFamilyVariables): MutationRef<CreateFamilyData, CreateFamilyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateFamilyVariables): MutationRef<CreateFamilyData, CreateFamilyVariables>;
  operationName: string;
}
export const createFamilyRef: CreateFamilyRef;

export function createFamily(vars: CreateFamilyVariables): MutationPromise<CreateFamilyData, CreateFamilyVariables>;
export function createFamily(dc: DataConnect, vars: CreateFamilyVariables): MutationPromise<CreateFamilyData, CreateFamilyVariables>;

interface RequestToJoinFamilyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RequestToJoinFamilyVariables): MutationRef<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RequestToJoinFamilyVariables): MutationRef<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;
  operationName: string;
}
export const requestToJoinFamilyRef: RequestToJoinFamilyRef;

export function requestToJoinFamily(vars: RequestToJoinFamilyVariables): MutationPromise<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;
export function requestToJoinFamily(dc: DataConnect, vars: RequestToJoinFamilyVariables): MutationPromise<RequestToJoinFamilyData, RequestToJoinFamilyVariables>;

interface ApproveJoinRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApproveJoinRequestVariables): MutationRef<ApproveJoinRequestData, ApproveJoinRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ApproveJoinRequestVariables): MutationRef<ApproveJoinRequestData, ApproveJoinRequestVariables>;
  operationName: string;
}
export const approveJoinRequestRef: ApproveJoinRequestRef;

export function approveJoinRequest(vars: ApproveJoinRequestVariables): MutationPromise<ApproveJoinRequestData, ApproveJoinRequestVariables>;
export function approveJoinRequest(dc: DataConnect, vars: ApproveJoinRequestVariables): MutationPromise<ApproveJoinRequestData, ApproveJoinRequestVariables>;

interface DenyJoinRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DenyJoinRequestVariables): MutationRef<DenyJoinRequestData, DenyJoinRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DenyJoinRequestVariables): MutationRef<DenyJoinRequestData, DenyJoinRequestVariables>;
  operationName: string;
}
export const denyJoinRequestRef: DenyJoinRequestRef;

export function denyJoinRequest(vars: DenyJoinRequestVariables): MutationPromise<DenyJoinRequestData, DenyJoinRequestVariables>;
export function denyJoinRequest(dc: DataConnect, vars: DenyJoinRequestVariables): MutationPromise<DenyJoinRequestData, DenyJoinRequestVariables>;

interface CancelMyJoinRequestRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelMyJoinRequestVariables): MutationRef<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CancelMyJoinRequestVariables): MutationRef<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;
  operationName: string;
}
export const cancelMyJoinRequestRef: CancelMyJoinRequestRef;

export function cancelMyJoinRequest(vars: CancelMyJoinRequestVariables): MutationPromise<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;
export function cancelMyJoinRequest(dc: DataConnect, vars: CancelMyJoinRequestVariables): MutationPromise<CancelMyJoinRequestData, CancelMyJoinRequestVariables>;

interface LeaveMyFamilyRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: LeaveMyFamilyVariables): MutationRef<LeaveMyFamilyData, LeaveMyFamilyVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: LeaveMyFamilyVariables): MutationRef<LeaveMyFamilyData, LeaveMyFamilyVariables>;
  operationName: string;
}
export const leaveMyFamilyRef: LeaveMyFamilyRef;

export function leaveMyFamily(vars: LeaveMyFamilyVariables): MutationPromise<LeaveMyFamilyData, LeaveMyFamilyVariables>;
export function leaveMyFamily(dc: DataConnect, vars: LeaveMyFamilyVariables): MutationPromise<LeaveMyFamilyData, LeaveMyFamilyVariables>;

interface RegenerateFamilyInviteCodeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: RegenerateFamilyInviteCodeVariables): MutationRef<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: RegenerateFamilyInviteCodeVariables): MutationRef<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;
  operationName: string;
}
export const regenerateFamilyInviteCodeRef: RegenerateFamilyInviteCodeRef;

export function regenerateFamilyInviteCode(vars: RegenerateFamilyInviteCodeVariables): MutationPromise<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;
export function regenerateFamilyInviteCode(dc: DataConnect, vars: RegenerateFamilyInviteCodeVariables): MutationPromise<RegenerateFamilyInviteCodeData, RegenerateFamilyInviteCodeVariables>;

interface CreateUserSettingForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserSettingForUserVariables): MutationRef<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserSettingForUserVariables): MutationRef<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;
  operationName: string;
}
export const createUserSettingForUserRef: CreateUserSettingForUserRef;

export function createUserSettingForUser(vars: CreateUserSettingForUserVariables): MutationPromise<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;
export function createUserSettingForUser(dc: DataConnect, vars: CreateUserSettingForUserVariables): MutationPromise<CreateUserSettingForUserData, CreateUserSettingForUserVariables>;

interface CreateSelfFamilyMemberForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSelfFamilyMemberForUserVariables): MutationRef<CreateSelfFamilyMemberForUserData, CreateSelfFamilyMemberForUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSelfFamilyMemberForUserVariables): MutationRef<CreateSelfFamilyMemberForUserData, CreateSelfFamilyMemberForUserVariables>;
  operationName: string;
}
export const createSelfFamilyMemberForUserRef: CreateSelfFamilyMemberForUserRef;

export function createSelfFamilyMemberForUser(vars: CreateSelfFamilyMemberForUserVariables): MutationPromise<CreateSelfFamilyMemberForUserData, CreateSelfFamilyMemberForUserVariables>;
export function createSelfFamilyMemberForUser(dc: DataConnect, vars: CreateSelfFamilyMemberForUserVariables): MutationPromise<CreateSelfFamilyMemberForUserData, CreateSelfFamilyMemberForUserVariables>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface GetMyUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyUserData, undefined>;
  operationName: string;
}
export const getMyUserRef: GetMyUserRef;

export function getMyUser(options?: ExecuteQueryOptions): QueryPromise<GetMyUserData, undefined>;
export function getMyUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyUserData, undefined>;

interface ListColorSchemesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListColorSchemesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListColorSchemesData, undefined>;
  operationName: string;
}
export const listColorSchemesRef: ListColorSchemesRef;

export function listColorSchemes(options?: ExecuteQueryOptions): QueryPromise<ListColorSchemesData, undefined>;
export function listColorSchemes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListColorSchemesData, undefined>;

interface ListUserTypesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUserTypesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUserTypesData, undefined>;
  operationName: string;
}
export const listUserTypesRef: ListUserTypesRef;

export function listUserTypes(options?: ExecuteQueryOptions): QueryPromise<ListUserTypesData, undefined>;
export function listUserTypes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUserTypesData, undefined>;

interface GetUserAccessByGoogleUidRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserAccessByGoogleUidVariables): QueryRef<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserAccessByGoogleUidVariables): QueryRef<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;
  operationName: string;
}
export const getUserAccessByGoogleUidRef: GetUserAccessByGoogleUidRef;

export function getUserAccessByGoogleUid(vars: GetUserAccessByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;
export function getUserAccessByGoogleUid(dc: DataConnect, vars: GetUserAccessByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserAccessByGoogleUidData, GetUserAccessByGoogleUidVariables>;

interface GetUserProvisioningByGoogleUidRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserProvisioningByGoogleUidVariables): QueryRef<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserProvisioningByGoogleUidVariables): QueryRef<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;
  operationName: string;
}
export const getUserProvisioningByGoogleUidRef: GetUserProvisioningByGoogleUidRef;

export function getUserProvisioningByGoogleUid(vars: GetUserProvisioningByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;
export function getUserProvisioningByGoogleUid(dc: DataConnect, vars: GetUserProvisioningByGoogleUidVariables, options?: ExecuteQueryOptions): QueryPromise<GetUserProvisioningByGoogleUidData, GetUserProvisioningByGoogleUidVariables>;

interface ListFamilyMembersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListFamilyMembersVariables): QueryRef<ListFamilyMembersData, ListFamilyMembersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListFamilyMembersVariables): QueryRef<ListFamilyMembersData, ListFamilyMembersVariables>;
  operationName: string;
}
export const listFamilyMembersRef: ListFamilyMembersRef;

export function listFamilyMembers(vars?: ListFamilyMembersVariables, options?: ExecuteQueryOptions): QueryPromise<ListFamilyMembersData, ListFamilyMembersVariables>;
export function listFamilyMembers(dc: DataConnect, vars?: ListFamilyMembersVariables, options?: ExecuteQueryOptions): QueryPromise<ListFamilyMembersData, ListFamilyMembersVariables>;

interface ListCategoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListCategoriesVariables): QueryRef<ListCategoriesData, ListCategoriesVariables>;
  operationName: string;
}
export const listCategoriesRef: ListCategoriesRef;

export function listCategories(vars?: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;
export function listCategories(dc: DataConnect, vars?: ListCategoriesVariables, options?: ExecuteQueryOptions): QueryPromise<ListCategoriesData, ListCategoriesVariables>;

interface ListTransactionsByFamilyMemberRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListTransactionsByFamilyMemberVariables): QueryRef<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListTransactionsByFamilyMemberVariables): QueryRef<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;
  operationName: string;
}
export const listTransactionsByFamilyMemberRef: ListTransactionsByFamilyMemberRef;

export function listTransactionsByFamilyMember(vars: ListTransactionsByFamilyMemberVariables, options?: ExecuteQueryOptions): QueryPromise<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;
export function listTransactionsByFamilyMember(dc: DataConnect, vars: ListTransactionsByFamilyMemberVariables, options?: ExecuteQueryOptions): QueryPromise<ListTransactionsByFamilyMemberData, ListTransactionsByFamilyMemberVariables>;

interface ListMyTransactionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: ListMyTransactionsVariables): QueryRef<ListMyTransactionsData, ListMyTransactionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: ListMyTransactionsVariables): QueryRef<ListMyTransactionsData, ListMyTransactionsVariables>;
  operationName: string;
}
export const listMyTransactionsRef: ListMyTransactionsRef;

export function listMyTransactions(vars?: ListMyTransactionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, ListMyTransactionsVariables>;
export function listMyTransactions(dc: DataConnect, vars?: ListMyTransactionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsData, ListMyTransactionsVariables>;

interface ListMyTransactionsByDateRangeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyTransactionsByDateRangeVariables): QueryRef<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListMyTransactionsByDateRangeVariables): QueryRef<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;
  operationName: string;
}
export const listMyTransactionsByDateRangeRef: ListMyTransactionsByDateRangeRef;

export function listMyTransactionsByDateRange(vars: ListMyTransactionsByDateRangeVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;
export function listMyTransactionsByDateRange(dc: DataConnect, vars: ListMyTransactionsByDateRangeVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyTransactionsByDateRangeData, ListMyTransactionsByDateRangeVariables>;

interface GetFamilyByInviteCodeRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetFamilyByInviteCodeVariables): QueryRef<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetFamilyByInviteCodeVariables): QueryRef<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;
  operationName: string;
}
export const getFamilyByInviteCodeRef: GetFamilyByInviteCodeRef;

export function getFamilyByInviteCode(vars: GetFamilyByInviteCodeVariables, options?: ExecuteQueryOptions): QueryPromise<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;
export function getFamilyByInviteCode(dc: DataConnect, vars: GetFamilyByInviteCodeVariables, options?: ExecuteQueryOptions): QueryPromise<GetFamilyByInviteCodeData, GetFamilyByInviteCodeVariables>;

interface GetMyFamilyDetailRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyFamilyDetailData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyFamilyDetailData, undefined>;
  operationName: string;
}
export const getMyFamilyDetailRef: GetMyFamilyDetailRef;

export function getMyFamilyDetail(options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDetailData, undefined>;
export function getMyFamilyDetail(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyFamilyDetailData, undefined>;

interface GetMyJoinRequestsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyJoinRequestsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyJoinRequestsData, undefined>;
  operationName: string;
}
export const getMyJoinRequestsRef: GetMyJoinRequestsRef;

export function getMyJoinRequests(options?: ExecuteQueryOptions): QueryPromise<GetMyJoinRequestsData, undefined>;
export function getMyJoinRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyJoinRequestsData, undefined>;

interface ListMyRecurringProjectionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyRecurringProjectionsVariables): QueryRef<ListMyRecurringProjectionsData, ListMyRecurringProjectionsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListMyRecurringProjectionsVariables): QueryRef<ListMyRecurringProjectionsData, ListMyRecurringProjectionsVariables>;
  operationName: string;
}
export const listMyRecurringProjectionsRef: ListMyRecurringProjectionsRef;

export function listMyRecurringProjections(vars: ListMyRecurringProjectionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyRecurringProjectionsData, ListMyRecurringProjectionsVariables>;
export function listMyRecurringProjections(dc: DataConnect, vars: ListMyRecurringProjectionsVariables, options?: ExecuteQueryOptions): QueryPromise<ListMyRecurringProjectionsData, ListMyRecurringProjectionsVariables>;

