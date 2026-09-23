import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

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
  categoryName?: string | null;
  source?: string | null;
  status?: string | null;
}

export interface CreateUserFromGoogleData {
  userType_upsert: UserType_Key;
  user_insert: User_Key;
}

export interface CreateUserFromGoogleVariables {
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
    userSetting?: {
      id: UUIDString;
    } & UserSetting_Key;
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
  } & FamilyMember_Key)[];
}

export interface ListFamilyMembersVariables {
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

/** Generated Node Admin SDK operation action function for the 'CreateUserFromGoogle' Mutation. Allow users to execute without passing in DataConnect. */
export function createUserFromGoogle(dc: DataConnect, vars: CreateUserFromGoogleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserFromGoogleData>>;
/** Generated Node Admin SDK operation action function for the 'CreateUserFromGoogle' Mutation. Allow users to pass in custom DataConnect instances. */
export function createUserFromGoogle(vars: CreateUserFromGoogleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserFromGoogleData>>;

/** Generated Node Admin SDK operation action function for the 'SetUserType' Mutation. Allow users to execute without passing in DataConnect. */
export function setUserType(dc: DataConnect, vars: SetUserTypeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetUserTypeData>>;
/** Generated Node Admin SDK operation action function for the 'SetUserType' Mutation. Allow users to pass in custom DataConnect instances. */
export function setUserType(vars: SetUserTypeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SetUserTypeData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyColorScheme' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyColorScheme(dc: DataConnect, vars: SelectMyColorSchemeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyColorSchemeData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyColorScheme' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyColorScheme(vars: SelectMyColorSchemeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyColorSchemeData>>;

/** Generated Node Admin SDK operation action function for the 'ClearMyColorScheme' Mutation. Allow users to execute without passing in DataConnect. */
export function clearMyColorScheme(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ClearMyColorSchemeData>>;
/** Generated Node Admin SDK operation action function for the 'ClearMyColorScheme' Mutation. Allow users to pass in custom DataConnect instances. */
export function clearMyColorScheme(options?: OperationOptions): Promise<ExecuteOperationResponse<ClearMyColorSchemeData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyPerformanceMode' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyPerformanceMode(dc: DataConnect, vars: SelectMyPerformanceModeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyPerformanceModeData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyPerformanceMode' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyPerformanceMode(vars: SelectMyPerformanceModeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyPerformanceModeData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyBackgroundOpacity' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyBackgroundOpacity(dc: DataConnect, vars: SelectMyBackgroundOpacityVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyBackgroundOpacityData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyBackgroundOpacity' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyBackgroundOpacity(vars: SelectMyBackgroundOpacityVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyBackgroundOpacityData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyExternalAccountLinkTemplate' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyExternalAccountLinkTemplate(dc: DataConnect, vars?: SelectMyExternalAccountLinkTemplateVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyExternalAccountLinkTemplateData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyExternalAccountLinkTemplate' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyExternalAccountLinkTemplate(vars?: SelectMyExternalAccountLinkTemplateVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyExternalAccountLinkTemplateData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyCardStyle' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyCardStyle(dc: DataConnect, vars: SelectMyCardStyleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyCardStyleData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyCardStyle' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyCardStyle(vars: SelectMyCardStyleVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyCardStyleData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMySquareCorners' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMySquareCorners(dc: DataConnect, vars: SelectMySquareCornersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMySquareCornersData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMySquareCorners' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMySquareCorners(vars: SelectMySquareCornersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMySquareCornersData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyBordersEnabled' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyBordersEnabled(dc: DataConnect, vars: SelectMyBordersEnabledVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyBordersEnabledData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyBordersEnabled' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyBordersEnabled(vars: SelectMyBordersEnabledVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyBordersEnabledData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyCategoryColorsEnabled' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyCategoryColorsEnabled(dc: DataConnect, vars: SelectMyCategoryColorsEnabledVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyCategoryColorsEnabledData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyCategoryColorsEnabled' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyCategoryColorsEnabled(vars: SelectMyCategoryColorsEnabledVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyCategoryColorsEnabledData>>;

/** Generated Node Admin SDK operation action function for the 'SelectMyCurrency' Mutation. Allow users to execute without passing in DataConnect. */
export function selectMyCurrency(dc: DataConnect, vars: SelectMyCurrencyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyCurrencyData>>;
/** Generated Node Admin SDK operation action function for the 'SelectMyCurrency' Mutation. Allow users to pass in custom DataConnect instances. */
export function selectMyCurrency(vars: SelectMyCurrencyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<SelectMyCurrencyData>>;

/** Generated Node Admin SDK operation action function for the 'CreateFamilyMember' Mutation. Allow users to execute without passing in DataConnect. */
export function createFamilyMember(dc: DataConnect, vars: CreateFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateFamilyMemberData>>;
/** Generated Node Admin SDK operation action function for the 'CreateFamilyMember' Mutation. Allow users to pass in custom DataConnect instances. */
export function createFamilyMember(vars: CreateFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateFamilyMemberData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateFamilyMember' Mutation. Allow users to execute without passing in DataConnect. */
export function updateFamilyMember(dc: DataConnect, vars: UpdateFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateFamilyMemberData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateFamilyMember' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateFamilyMember(vars: UpdateFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateFamilyMemberData>>;

/** Generated Node Admin SDK operation action function for the 'RenameFamilyMember' Mutation. Allow users to execute without passing in DataConnect. */
export function renameFamilyMember(dc: DataConnect, vars: RenameFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RenameFamilyMemberData>>;
/** Generated Node Admin SDK operation action function for the 'RenameFamilyMember' Mutation. Allow users to pass in custom DataConnect instances. */
export function renameFamilyMember(vars: RenameFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RenameFamilyMemberData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteFamilyMember' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteFamilyMember(dc: DataConnect, vars: DeleteFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteFamilyMemberData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteFamilyMember' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteFamilyMember(vars: DeleteFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteFamilyMemberData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertCategory' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertCategory(dc: DataConnect, vars: UpsertCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertCategoryData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertCategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertCategory(vars: UpsertCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertCategoryData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateCategory' Mutation. Allow users to execute without passing in DataConnect. */
export function updateCategory(dc: DataConnect, vars: UpdateCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateCategoryData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateCategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateCategory(vars: UpdateCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateCategoryData>>;

/** Generated Node Admin SDK operation action function for the 'CreateTransaction' Mutation. Allow users to execute without passing in DataConnect. */
export function createTransaction(dc: DataConnect, vars: CreateTransactionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateTransactionData>>;
/** Generated Node Admin SDK operation action function for the 'CreateTransaction' Mutation. Allow users to pass in custom DataConnect instances. */
export function createTransaction(vars: CreateTransactionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateTransactionData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateTransaction' Mutation. Allow users to execute without passing in DataConnect. */
export function updateTransaction(dc: DataConnect, vars: UpdateTransactionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTransactionData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateTransaction' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateTransaction(vars: UpdateTransactionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTransactionData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateTransactionClearCategory' Mutation. Allow users to execute without passing in DataConnect. */
export function updateTransactionClearCategory(dc: DataConnect, vars: UpdateTransactionClearCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTransactionClearCategoryData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateTransactionClearCategory' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateTransactionClearCategory(vars: UpdateTransactionClearCategoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTransactionClearCategoryData>>;

/** Generated Node Admin SDK operation action function for the 'MarkTransactionPosted' Mutation. Allow users to execute without passing in DataConnect. */
export function markTransactionPosted(dc: DataConnect, vars: MarkTransactionPostedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkTransactionPostedData>>;
/** Generated Node Admin SDK operation action function for the 'MarkTransactionPosted' Mutation. Allow users to pass in custom DataConnect instances. */
export function markTransactionPosted(vars: MarkTransactionPostedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkTransactionPostedData>>;

/** Generated Node Admin SDK operation action function for the 'MarkTransactionProjected' Mutation. Allow users to execute without passing in DataConnect. */
export function markTransactionProjected(dc: DataConnect, vars: MarkTransactionProjectedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkTransactionProjectedData>>;
/** Generated Node Admin SDK operation action function for the 'MarkTransactionProjected' Mutation. Allow users to pass in custom DataConnect instances. */
export function markTransactionProjected(vars: MarkTransactionProjectedVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkTransactionProjectedData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteTransaction' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteTransaction(dc: DataConnect, vars: DeleteTransactionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteTransactionData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteTransaction' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteTransaction(vars: DeleteTransactionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteTransactionData>>;

/** Generated Node Admin SDK operation action function for the 'CreateFamily' Mutation. Allow users to execute without passing in DataConnect. */
export function createFamily(dc: DataConnect, vars: CreateFamilyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateFamilyData>>;
/** Generated Node Admin SDK operation action function for the 'CreateFamily' Mutation. Allow users to pass in custom DataConnect instances. */
export function createFamily(vars: CreateFamilyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateFamilyData>>;

/** Generated Node Admin SDK operation action function for the 'RequestToJoinFamily' Mutation. Allow users to execute without passing in DataConnect. */
export function requestToJoinFamily(dc: DataConnect, vars: RequestToJoinFamilyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RequestToJoinFamilyData>>;
/** Generated Node Admin SDK operation action function for the 'RequestToJoinFamily' Mutation. Allow users to pass in custom DataConnect instances. */
export function requestToJoinFamily(vars: RequestToJoinFamilyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RequestToJoinFamilyData>>;

/** Generated Node Admin SDK operation action function for the 'ApproveJoinRequest' Mutation. Allow users to execute without passing in DataConnect. */
export function approveJoinRequest(dc: DataConnect, vars: ApproveJoinRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ApproveJoinRequestData>>;
/** Generated Node Admin SDK operation action function for the 'ApproveJoinRequest' Mutation. Allow users to pass in custom DataConnect instances. */
export function approveJoinRequest(vars: ApproveJoinRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ApproveJoinRequestData>>;

/** Generated Node Admin SDK operation action function for the 'DenyJoinRequest' Mutation. Allow users to execute without passing in DataConnect. */
export function denyJoinRequest(dc: DataConnect, vars: DenyJoinRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DenyJoinRequestData>>;
/** Generated Node Admin SDK operation action function for the 'DenyJoinRequest' Mutation. Allow users to pass in custom DataConnect instances. */
export function denyJoinRequest(vars: DenyJoinRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DenyJoinRequestData>>;

/** Generated Node Admin SDK operation action function for the 'CancelMyJoinRequest' Mutation. Allow users to execute without passing in DataConnect. */
export function cancelMyJoinRequest(dc: DataConnect, vars: CancelMyJoinRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CancelMyJoinRequestData>>;
/** Generated Node Admin SDK operation action function for the 'CancelMyJoinRequest' Mutation. Allow users to pass in custom DataConnect instances. */
export function cancelMyJoinRequest(vars: CancelMyJoinRequestVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CancelMyJoinRequestData>>;

/** Generated Node Admin SDK operation action function for the 'LeaveMyFamily' Mutation. Allow users to execute without passing in DataConnect. */
export function leaveMyFamily(dc: DataConnect, vars: LeaveMyFamilyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<LeaveMyFamilyData>>;
/** Generated Node Admin SDK operation action function for the 'LeaveMyFamily' Mutation. Allow users to pass in custom DataConnect instances. */
export function leaveMyFamily(vars: LeaveMyFamilyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<LeaveMyFamilyData>>;

/** Generated Node Admin SDK operation action function for the 'RegenerateFamilyInviteCode' Mutation. Allow users to execute without passing in DataConnect. */
export function regenerateFamilyInviteCode(dc: DataConnect, vars: RegenerateFamilyInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RegenerateFamilyInviteCodeData>>;
/** Generated Node Admin SDK operation action function for the 'RegenerateFamilyInviteCode' Mutation. Allow users to pass in custom DataConnect instances. */
export function regenerateFamilyInviteCode(vars: RegenerateFamilyInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<RegenerateFamilyInviteCodeData>>;

/** Generated Node Admin SDK operation action function for the 'CreateUserSettingForUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createUserSettingForUser(dc: DataConnect, vars: CreateUserSettingForUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserSettingForUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateUserSettingForUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createUserSettingForUser(vars: CreateUserSettingForUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserSettingForUserData>>;

/** Generated Node Admin SDK operation action function for the 'ListUsers' Query. Allow users to execute without passing in DataConnect. */
export function listUsers(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListUsersData>>;
/** Generated Node Admin SDK operation action function for the 'ListUsers' Query. Allow users to pass in custom DataConnect instances. */
export function listUsers(options?: OperationOptions): Promise<ExecuteOperationResponse<ListUsersData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyUser' Query. Allow users to execute without passing in DataConnect. */
export function getMyUser(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyUserData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyUser' Query. Allow users to pass in custom DataConnect instances. */
export function getMyUser(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyUserData>>;

/** Generated Node Admin SDK operation action function for the 'ListColorSchemes' Query. Allow users to execute without passing in DataConnect. */
export function listColorSchemes(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListColorSchemesData>>;
/** Generated Node Admin SDK operation action function for the 'ListColorSchemes' Query. Allow users to pass in custom DataConnect instances. */
export function listColorSchemes(options?: OperationOptions): Promise<ExecuteOperationResponse<ListColorSchemesData>>;

/** Generated Node Admin SDK operation action function for the 'ListUserTypes' Query. Allow users to execute without passing in DataConnect. */
export function listUserTypes(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListUserTypesData>>;
/** Generated Node Admin SDK operation action function for the 'ListUserTypes' Query. Allow users to pass in custom DataConnect instances. */
export function listUserTypes(options?: OperationOptions): Promise<ExecuteOperationResponse<ListUserTypesData>>;

/** Generated Node Admin SDK operation action function for the 'GetUserAccessByGoogleUid' Query. Allow users to execute without passing in DataConnect. */
export function getUserAccessByGoogleUid(dc: DataConnect, vars: GetUserAccessByGoogleUidVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserAccessByGoogleUidData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserAccessByGoogleUid' Query. Allow users to pass in custom DataConnect instances. */
export function getUserAccessByGoogleUid(vars: GetUserAccessByGoogleUidVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserAccessByGoogleUidData>>;

/** Generated Node Admin SDK operation action function for the 'GetUserProvisioningByGoogleUid' Query. Allow users to execute without passing in DataConnect. */
export function getUserProvisioningByGoogleUid(dc: DataConnect, vars: GetUserProvisioningByGoogleUidVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserProvisioningByGoogleUidData>>;
/** Generated Node Admin SDK operation action function for the 'GetUserProvisioningByGoogleUid' Query. Allow users to pass in custom DataConnect instances. */
export function getUserProvisioningByGoogleUid(vars: GetUserProvisioningByGoogleUidVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetUserProvisioningByGoogleUidData>>;

/** Generated Node Admin SDK operation action function for the 'ListFamilyMembers' Query. Allow users to execute without passing in DataConnect. */
export function listFamilyMembers(dc: DataConnect, vars?: ListFamilyMembersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListFamilyMembersData>>;
/** Generated Node Admin SDK operation action function for the 'ListFamilyMembers' Query. Allow users to pass in custom DataConnect instances. */
export function listFamilyMembers(vars?: ListFamilyMembersVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListFamilyMembersData>>;

/** Generated Node Admin SDK operation action function for the 'ListCategories' Query. Allow users to execute without passing in DataConnect. */
export function listCategories(dc: DataConnect, vars?: ListCategoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCategoriesData>>;
/** Generated Node Admin SDK operation action function for the 'ListCategories' Query. Allow users to pass in custom DataConnect instances. */
export function listCategories(vars?: ListCategoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListCategoriesData>>;

/** Generated Node Admin SDK operation action function for the 'ListTransactionsByFamilyMember' Query. Allow users to execute without passing in DataConnect. */
export function listTransactionsByFamilyMember(dc: DataConnect, vars: ListTransactionsByFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListTransactionsByFamilyMemberData>>;
/** Generated Node Admin SDK operation action function for the 'ListTransactionsByFamilyMember' Query. Allow users to pass in custom DataConnect instances. */
export function listTransactionsByFamilyMember(vars: ListTransactionsByFamilyMemberVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListTransactionsByFamilyMemberData>>;

/** Generated Node Admin SDK operation action function for the 'ListMyTransactions' Query. Allow users to execute without passing in DataConnect. */
export function listMyTransactions(dc: DataConnect, vars?: ListMyTransactionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyTransactionsData>>;
/** Generated Node Admin SDK operation action function for the 'ListMyTransactions' Query. Allow users to pass in custom DataConnect instances. */
export function listMyTransactions(vars?: ListMyTransactionsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyTransactionsData>>;

/** Generated Node Admin SDK operation action function for the 'ListMyTransactionsByDateRange' Query. Allow users to execute without passing in DataConnect. */
export function listMyTransactionsByDateRange(dc: DataConnect, vars: ListMyTransactionsByDateRangeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyTransactionsByDateRangeData>>;
/** Generated Node Admin SDK operation action function for the 'ListMyTransactionsByDateRange' Query. Allow users to pass in custom DataConnect instances. */
export function listMyTransactionsByDateRange(vars: ListMyTransactionsByDateRangeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyTransactionsByDateRangeData>>;

/** Generated Node Admin SDK operation action function for the 'GetFamilyByInviteCode' Query. Allow users to execute without passing in DataConnect. */
export function getFamilyByInviteCode(dc: DataConnect, vars: GetFamilyByInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetFamilyByInviteCodeData>>;
/** Generated Node Admin SDK operation action function for the 'GetFamilyByInviteCode' Query. Allow users to pass in custom DataConnect instances. */
export function getFamilyByInviteCode(vars: GetFamilyByInviteCodeVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetFamilyByInviteCodeData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyFamilyDetail' Query. Allow users to execute without passing in DataConnect. */
export function getMyFamilyDetail(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyFamilyDetailData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyFamilyDetail' Query. Allow users to pass in custom DataConnect instances. */
export function getMyFamilyDetail(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyFamilyDetailData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyJoinRequests' Query. Allow users to execute without passing in DataConnect. */
export function getMyJoinRequests(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyJoinRequestsData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyJoinRequests' Query. Allow users to pass in custom DataConnect instances. */
export function getMyJoinRequests(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyJoinRequestsData>>;

