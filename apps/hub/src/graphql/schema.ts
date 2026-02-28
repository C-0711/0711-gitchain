export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  type Query {
    # Viewer (current user)
    viewer: User

    # Users
    user(username: String, id: ID): User
    users(first: Int, after: String, query: String): UserConnection!

    # Containers
    container(id: ID, identifier: String): Container
    containers(
      first: Int
      after: String
      query: String
      visibility: Visibility
      sort: ContainerSort
    ): ContainerConnection!

    # Explore & Trending
    explore(
      first: Int
      after: String
      query: String
      language: String
      topic: String
      sort: ContainerSort
    ): ContainerConnection!

    trending(since: TrendingPeriod, language: String, first: Int): [TrendingContainer!]!

    # Organizations
    organization(slug: String!): Organization
    organizations(first: Int, after: String): OrganizationConnection!

    # Search
    search(query: String!, type: SearchType, first: Int, after: String): SearchResultConnection!

    # Notifications
    notifications(
      first: Int
      after: String
      filter: NotificationFilter
    ): NotificationConnection!

    # Activity
    activityFeed(first: Int, after: String, filter: ActivityFilter): ActivityConnection!
  }

  type Mutation {
    # Container mutations
    createContainer(input: CreateContainerInput!): CreateContainerPayload!
    updateContainer(id: ID!, input: UpdateContainerInput!): UpdateContainerPayload!
    deleteContainer(id: ID!): DeleteContainerPayload!
    forkContainer(id: ID!, input: ForkContainerInput): ForkContainerPayload!

    # Star/Watch mutations
    starContainer(id: ID!): StarContainerPayload!
    unstarContainer(id: ID!): UnstarContainerPayload!
    watchContainer(id: ID!, level: WatchLevel!): WatchContainerPayload!
    unwatchContainer(id: ID!): UnwatchContainerPayload!

    # User mutations
    followUser(id: ID!): FollowUserPayload!
    unfollowUser(id: ID!): UnfollowUserPayload!
    updateProfile(input: UpdateProfileInput!): UpdateProfilePayload!

    # Notification mutations
    markNotificationRead(id: ID!): MarkNotificationReadPayload!
    markAllNotificationsRead: MarkAllNotificationsReadPayload!
    archiveNotification(id: ID!): ArchiveNotificationPayload!

    # Token mutations
    createPersonalAccessToken(input: CreatePATInput!): CreatePATPayload!
    revokePersonalAccessToken(id: ID!): RevokePATPayload!

    # Webhook mutations
    createWebhook(containerId: ID!, input: CreateWebhookInput!): CreateWebhookPayload!
    updateWebhook(id: ID!, input: UpdateWebhookInput!): UpdateWebhookPayload!
    deleteWebhook(id: ID!): DeleteWebhookPayload!
  }

  # ============================================================================
  # ENUMS
  # ============================================================================

  enum Visibility {
    PUBLIC
    PRIVATE
    INTERNAL
  }

  enum ContainerSort {
    STARS
    FORKS
    UPDATED
    CREATED
    NAME
  }

  enum TrendingPeriod {
    DAILY
    WEEKLY
    MONTHLY
  }

  enum SearchType {
    CONTAINERS
    USERS
    ORGANIZATIONS
    ALL
  }

  enum NotificationFilter {
    UNREAD
    ALL
    ARCHIVED
  }

  enum ActivityFilter {
    ALL
    OWN
    FOLLOWING
    CONTAINERS
  }

  enum WatchLevel {
    ALL
    PARTICIPATING
    MENTIONS
    IGNORE
  }

  enum CollaboratorRole {
    MAINTAINER
    EDITOR
    REVIEWER
    VIEWER
  }

  enum OrgRole {
    OWNER
    ADMIN
    MAINTAINER
    MEMBER
    VIEWER
  }

  # ============================================================================
  # TYPES
  # ============================================================================

  type User {
    id: ID!
    username: String!
    name: String
    email: String
    avatarUrl: String
    bio: String
    location: String
    website: String
    company: String
    followerCount: Int!
    followingCount: Int!
    createdAt: DateTime!

    # Connections
    followers(first: Int, after: String): UserConnection!
    following(first: Int, after: String): UserConnection!
    starredContainers(first: Int, after: String, sort: ContainerSort): ContainerConnection!
    containers(first: Int, after: String, visibility: Visibility): ContainerConnection!
    organizations: [OrganizationMembership!]!
    contributions(year: Int): ContributionCalendar!
    activity(first: Int, after: String): ActivityConnection!

    # Viewer-specific
    viewerIsFollowing: Boolean!
    isViewer: Boolean!
  }

  type Container {
    id: ID!
    identifier: String!
    name: String!
    description: String
    visibility: Visibility!
    starCount: Int!
    forkCount: Int!
    watchCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!

    # Relations
    owner: User!
    namespace: Namespace
    organization: Organization
    forkedFrom: Container

    # Content
    atoms(first: Int, after: String, path: String): AtomConnection!
    atomCount: Int!

    # Social
    stargazers(first: Int, after: String): UserConnection!
    watchers(first: Int, after: String): UserConnection!
    forks(first: Int, after: String, sort: ContainerSort): ContainerConnection!
    collaborators(first: Int, after: String): CollaboratorConnection!

    # Stats
    stats: ContainerStats!
    trustScore: Int!

    # Viewer-specific
    viewerHasStarred: Boolean!
    viewerWatchLevel: WatchLevel
    viewerPermission: CollaboratorRole
  }

  type Atom {
    id: ID!
    path: String!
    contentHash: String!
    contentType: String!
    content: JSON
    metadata: JSON
    createdAt: DateTime!
    createdBy: User

    # Certification
    certified: Boolean!
    batchId: Int
    merkleProof: [String!]
  }

  type Organization {
    id: ID!
    slug: String!
    name: String!
    description: String
    avatarUrl: String
    website: String
    verified: Boolean!
    plan: String!
    createdAt: DateTime!

    # Connections
    members(first: Int, after: String, role: OrgRole): OrgMemberConnection!
    teams(first: Int, after: String): TeamConnection!
    containers(first: Int, after: String, visibility: Visibility): ContainerConnection!

    # Viewer-specific
    viewerRole: OrgRole
    viewerCanAdmin: Boolean!
  }

  type Team {
    id: ID!
    slug: String!
    name: String!
    description: String
    organization: Organization!
    members(first: Int, after: String): OrgMemberConnection!
  }

  type Namespace {
    id: ID!
    slug: String!
    name: String!
    owner: User
    organization: Organization
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    body: String
    url: String
    read: Boolean!
    readAt: DateTime
    createdAt: DateTime!

    actor: User
    container: Container
    organization: Organization
  }

  type ActivityEvent {
    id: ID!
    eventType: String!
    targetType: String!
    targetId: ID!
    metadata: JSON
    createdAt: DateTime!

    actor: User
    container: Container
    organization: Organization
  }

  type PersonalAccessToken {
    id: ID!
    name: String!
    tokenPrefix: String!
    scopes: [String!]!
    expiresAt: DateTime
    lastUsedAt: DateTime
    createdAt: DateTime!
    isExpired: Boolean!
  }

  type Webhook {
    id: ID!
    name: String!
    url: String!
    events: [String!]!
    active: Boolean!
    contentType: String!
    sslVerification: Boolean!
    lastDeliveryAt: DateTime
    lastResponseCode: Int
    consecutiveFailures: Int!
    createdAt: DateTime!
  }

  # ============================================================================
  # STATS & CONTRIBUTIONS
  # ============================================================================

  type ContainerStats {
    totalAtoms: Int!
    certifiedAtoms: Int!
    contentTypes: Int!
    totalSize: Int!
    contributors: [Contributor!]!
    activityTimeline: [DailyCount!]!
    starTimeline: [DailyCount!]!
  }

  type Contributor {
    user: User!
    contributions: Int!
  }

  type DailyCount {
    date: String!
    count: Int!
  }

  type ContributionCalendar {
    year: Int!
    totalContributions: Int!
    longestStreak: Int!
    currentStreak: Int!
    weeks: [[ContributionDay!]!]!
  }

  type ContributionDay {
    date: String!
    count: Int!
    level: Int!
  }

  type TrendingContainer {
    rank: Int!
    container: Container!
    recentStars: Int!
    recentForks: Int!
  }

  # ============================================================================
  # CONNECTIONS (Relay-style pagination)
  # ============================================================================

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type UserConnection {
    edges: [UserEdge!]!
    nodes: [User!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type ContainerConnection {
    edges: [ContainerEdge!]!
    nodes: [Container!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ContainerEdge {
    node: Container!
    cursor: String!
  }

  type AtomConnection {
    edges: [AtomEdge!]!
    nodes: [Atom!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AtomEdge {
    node: Atom!
    cursor: String!
  }

  type OrganizationConnection {
    edges: [OrganizationEdge!]!
    nodes: [Organization!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type OrganizationEdge {
    node: Organization!
    cursor: String!
  }

  type OrgMemberConnection {
    edges: [OrgMemberEdge!]!
    nodes: [OrganizationMembership!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type OrgMemberEdge {
    node: OrganizationMembership!
    cursor: String!
  }

  type OrganizationMembership {
    user: User!
    organization: Organization!
    role: OrgRole!
    joinedAt: DateTime!
  }

  type TeamConnection {
    edges: [TeamEdge!]!
    nodes: [Team!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TeamEdge {
    node: Team!
    cursor: String!
  }

  type CollaboratorConnection {
    edges: [CollaboratorEdge!]!
    nodes: [Collaborator!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CollaboratorEdge {
    node: Collaborator!
    cursor: String!
  }

  type Collaborator {
    user: User!
    role: CollaboratorRole!
    addedAt: DateTime!
  }

  type NotificationConnection {
    edges: [NotificationEdge!]!
    nodes: [Notification!]!
    pageInfo: PageInfo!
    totalCount: Int!
    unreadCount: Int!
  }

  type NotificationEdge {
    node: Notification!
    cursor: String!
  }

  type ActivityConnection {
    edges: [ActivityEdge!]!
    nodes: [ActivityEvent!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ActivityEdge {
    node: ActivityEvent!
    cursor: String!
  }

  type SearchResultConnection {
    edges: [SearchResultEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
    containerCount: Int!
    userCount: Int!
    orgCount: Int!
  }

  type SearchResultEdge {
    node: SearchResult!
    cursor: String!
  }

  union SearchResult = Container | User | Organization

  # ============================================================================
  # INPUTS
  # ============================================================================

  input CreateContainerInput {
    identifier: String!
    name: String!
    description: String
    visibility: Visibility
    namespaceId: ID
  }

  input UpdateContainerInput {
    name: String
    description: String
    visibility: Visibility
  }

  input ForkContainerInput {
    name: String
    namespaceId: ID
  }

  input UpdateProfileInput {
    name: String
    bio: String
    location: String
    website: String
    company: String
  }

  input CreatePATInput {
    name: String!
    scopes: [String!]!
    expiresAt: DateTime
    description: String
  }

  input CreateWebhookInput {
    name: String!
    url: String!
    events: [String!]!
    contentType: String
    sslVerification: Boolean
  }

  input UpdateWebhookInput {
    name: String
    url: String
    events: [String!]
    active: Boolean
    sslVerification: Boolean
    regenerateSecret: Boolean
  }

  # ============================================================================
  # PAYLOADS
  # ============================================================================

  type CreateContainerPayload {
    container: Container
    errors: [Error!]
  }

  type UpdateContainerPayload {
    container: Container
    errors: [Error!]
  }

  type DeleteContainerPayload {
    success: Boolean!
    errors: [Error!]
  }

  type ForkContainerPayload {
    container: Container
    errors: [Error!]
  }

  type StarContainerPayload {
    container: Container
    errors: [Error!]
  }

  type UnstarContainerPayload {
    container: Container
    errors: [Error!]
  }

  type WatchContainerPayload {
    container: Container
    errors: [Error!]
  }

  type UnwatchContainerPayload {
    container: Container
    errors: [Error!]
  }

  type FollowUserPayload {
    user: User
    errors: [Error!]
  }

  type UnfollowUserPayload {
    user: User
    errors: [Error!]
  }

  type UpdateProfilePayload {
    user: User
    errors: [Error!]
  }

  type MarkNotificationReadPayload {
    notification: Notification
    errors: [Error!]
  }

  type MarkAllNotificationsReadPayload {
    success: Boolean!
    errors: [Error!]
  }

  type ArchiveNotificationPayload {
    notification: Notification
    errors: [Error!]
  }

  type CreatePATPayload {
    token: String
    tokenInfo: PersonalAccessToken
    errors: [Error!]
  }

  type RevokePATPayload {
    success: Boolean!
    errors: [Error!]
  }

  type CreateWebhookPayload {
    webhook: Webhook
    secret: String
    errors: [Error!]
  }

  type UpdateWebhookPayload {
    webhook: Webhook
    secret: String
    errors: [Error!]
  }

  type DeleteWebhookPayload {
    success: Boolean!
    errors: [Error!]
  }

  type Error {
    field: String
    message: String!
  }
`;
