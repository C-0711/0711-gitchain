import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromToken } from "@/lib/db";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLScalarType,
  Kind,
  parse,
  validate,
  execute,
  DocumentNode,
} from "graphql";

// Custom scalars
const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "DateTime scalar type",
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  },
  parseValue(value) {
    return new Date(value as string);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "JSON scalar type",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return ast.value;
      }
    }
    return null;
  },
});

// Build schema dynamically (simplified version)
// In production, use graphql-tools or similar
let schema: GraphQLSchema;

function buildSchema(): GraphQLSchema {
  if (schema) return schema;

  // Enums
  const VisibilityEnum = new GraphQLEnumType({
    name: "Visibility",
    values: { PUBLIC: {}, PRIVATE: {}, INTERNAL: {} },
  });

  const ContainerSortEnum = new GraphQLEnumType({
    name: "ContainerSort",
    values: { STARS: {}, FORKS: {}, UPDATED: {}, CREATED: {}, NAME: {} },
  });

  const TrendingPeriodEnum = new GraphQLEnumType({
    name: "TrendingPeriod",
    values: { DAILY: {}, WEEKLY: {}, MONTHLY: {} },
  });

  const NotificationFilterEnum = new GraphQLEnumType({
    name: "NotificationFilter",
    values: { UNREAD: {}, ALL: {}, ARCHIVED: {} },
  });

  const ActivityFilterEnum = new GraphQLEnumType({
    name: "ActivityFilter",
    values: { ALL: {}, OWN: {}, FOLLOWING: {}, CONTAINERS: {} },
  });

  const WatchLevelEnum = new GraphQLEnumType({
    name: "WatchLevel",
    values: { ALL: {}, PARTICIPATING: {}, MENTIONS: {}, IGNORE: {} },
  });

  // PageInfo type
  const PageInfoType = new GraphQLObjectType({
    name: "PageInfo",
    fields: {
      hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
      hasPreviousPage: { type: new GraphQLNonNull(GraphQLBoolean) },
      startCursor: { type: GraphQLString },
      endCursor: { type: GraphQLString },
    },
  });

  // Error type
  const ErrorType = new GraphQLObjectType({
    name: "Error",
    fields: {
      field: { type: GraphQLString },
      message: { type: new GraphQLNonNull(GraphQLString) },
    },
  });

  // User type (simplified)
  const UserType: GraphQLObjectType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
      id: { type: new GraphQLNonNull(GraphQLID) },
      username: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: GraphQLString },
      email: { type: GraphQLString },
      avatarUrl: { type: GraphQLString },
      bio: { type: GraphQLString },
      location: { type: GraphQLString },
      website: { type: GraphQLString },
      company: { type: GraphQLString },
      followerCount: { type: new GraphQLNonNull(GraphQLInt) },
      followingCount: { type: new GraphQLNonNull(GraphQLInt) },
      createdAt: { type: DateTimeScalar },
      viewerIsFollowing: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: resolvers.User.viewerIsFollowing,
      },
      isViewer: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: resolvers.User.isViewer,
      },
    }),
  });

  // Container type (simplified)
  const ContainerType: GraphQLObjectType = new GraphQLObjectType({
    name: "Container",
    fields: () => ({
      id: { type: new GraphQLNonNull(GraphQLID) },
      identifier: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      description: { type: GraphQLString },
      visibility: { type: new GraphQLNonNull(VisibilityEnum) },
      starCount: { type: new GraphQLNonNull(GraphQLInt) },
      forkCount: { type: new GraphQLNonNull(GraphQLInt) },
      watchCount: { type: new GraphQLNonNull(GraphQLInt) },
      createdAt: { type: DateTimeScalar },
      updatedAt: { type: DateTimeScalar },
      owner: {
        type: UserType,
        resolve: resolvers.Container.owner,
      },
      viewerHasStarred: {
        type: new GraphQLNonNull(GraphQLBoolean),
        resolve: resolvers.Container.viewerHasStarred,
      },
      atomCount: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve: resolvers.Container.atomCount,
      },
      trustScore: {
        type: new GraphQLNonNull(GraphQLInt),
        resolve: resolvers.Container.trustScore,
      },
    }),
  });

  // Organization type
  const OrganizationType = new GraphQLObjectType({
    name: "Organization",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      slug: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: new GraphQLNonNull(GraphQLString) },
      description: { type: GraphQLString },
      avatarUrl: { type: GraphQLString },
      website: { type: GraphQLString },
      verified: { type: new GraphQLNonNull(GraphQLBoolean) },
      plan: { type: new GraphQLNonNull(GraphQLString) },
      createdAt: { type: DateTimeScalar },
    },
  });

  // Notification type
  const NotificationType = new GraphQLObjectType({
    name: "Notification",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      type: { type: new GraphQLNonNull(GraphQLString) },
      title: { type: new GraphQLNonNull(GraphQLString) },
      body: { type: GraphQLString },
      url: { type: GraphQLString },
      read: { type: new GraphQLNonNull(GraphQLBoolean) },
      readAt: { type: DateTimeScalar },
      createdAt: { type: DateTimeScalar },
    },
  });

  // Activity event type
  const ActivityEventType = new GraphQLObjectType({
    name: "ActivityEvent",
    fields: {
      id: { type: new GraphQLNonNull(GraphQLID) },
      eventType: { type: new GraphQLNonNull(GraphQLString) },
      targetType: { type: new GraphQLNonNull(GraphQLString) },
      targetId: { type: new GraphQLNonNull(GraphQLID) },
      metadata: { type: JSONScalar },
      createdAt: { type: DateTimeScalar },
    },
  });

  // Trending container type
  const TrendingContainerType = new GraphQLObjectType({
    name: "TrendingContainer",
    fields: {
      rank: { type: new GraphQLNonNull(GraphQLInt) },
      container: { type: new GraphQLNonNull(ContainerType) },
      recentStars: { type: new GraphQLNonNull(GraphQLInt) },
      recentForks: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  // Connection types
  const UserEdgeType = new GraphQLObjectType({
    name: "UserEdge",
    fields: {
      node: { type: new GraphQLNonNull(UserType) },
      cursor: { type: new GraphQLNonNull(GraphQLString) },
    },
  });

  const UserConnectionType = new GraphQLObjectType({
    name: "UserConnection",
    fields: {
      edges: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserEdgeType))) },
      nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))) },
      pageInfo: { type: new GraphQLNonNull(PageInfoType) },
      totalCount: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  const ContainerEdgeType = new GraphQLObjectType({
    name: "ContainerEdge",
    fields: {
      node: { type: new GraphQLNonNull(ContainerType) },
      cursor: { type: new GraphQLNonNull(GraphQLString) },
    },
  });

  const ContainerConnectionType = new GraphQLObjectType({
    name: "ContainerConnection",
    fields: {
      edges: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ContainerEdgeType))) },
      nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ContainerType))) },
      pageInfo: { type: new GraphQLNonNull(PageInfoType) },
      totalCount: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  const NotificationEdgeType = new GraphQLObjectType({
    name: "NotificationEdge",
    fields: {
      node: { type: new GraphQLNonNull(NotificationType) },
      cursor: { type: new GraphQLNonNull(GraphQLString) },
    },
  });

  const NotificationConnectionType = new GraphQLObjectType({
    name: "NotificationConnection",
    fields: {
      edges: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NotificationEdgeType))) },
      nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(NotificationType))) },
      pageInfo: { type: new GraphQLNonNull(PageInfoType) },
      totalCount: { type: new GraphQLNonNull(GraphQLInt) },
      unreadCount: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  const ActivityEdgeType = new GraphQLObjectType({
    name: "ActivityEdge",
    fields: {
      node: { type: new GraphQLNonNull(ActivityEventType) },
      cursor: { type: new GraphQLNonNull(GraphQLString) },
    },
  });

  const ActivityConnectionType = new GraphQLObjectType({
    name: "ActivityConnection",
    fields: {
      edges: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ActivityEdgeType))) },
      nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ActivityEventType))) },
      pageInfo: { type: new GraphQLNonNull(PageInfoType) },
      totalCount: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  // Query type
  const QueryType = new GraphQLObjectType({
    name: "Query",
    fields: {
      viewer: {
        type: UserType,
        resolve: resolvers.Query.viewer,
      },
      user: {
        type: UserType,
        args: {
          username: { type: GraphQLString },
          id: { type: GraphQLID },
        },
        resolve: resolvers.Query.user,
      },
      container: {
        type: ContainerType,
        args: {
          id: { type: GraphQLID },
          identifier: { type: GraphQLString },
        },
        resolve: resolvers.Query.container,
      },
      containers: {
        type: new GraphQLNonNull(ContainerConnectionType),
        args: {
          first: { type: GraphQLInt },
          after: { type: GraphQLString },
          query: { type: GraphQLString },
          visibility: { type: VisibilityEnum },
          sort: { type: ContainerSortEnum },
        },
        resolve: resolvers.Query.containers,
      },
      explore: {
        type: new GraphQLNonNull(ContainerConnectionType),
        args: {
          first: { type: GraphQLInt },
          after: { type: GraphQLString },
          query: { type: GraphQLString },
          language: { type: GraphQLString },
          topic: { type: GraphQLString },
          sort: { type: ContainerSortEnum },
        },
        resolve: resolvers.Query.explore,
      },
      trending: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TrendingContainerType))),
        args: {
          since: { type: TrendingPeriodEnum },
          language: { type: GraphQLString },
          first: { type: GraphQLInt },
        },
        resolve: resolvers.Query.trending,
      },
      organization: {
        type: OrganizationType,
        args: {
          slug: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: resolvers.Query.organization,
      },
      notifications: {
        type: new GraphQLNonNull(NotificationConnectionType),
        args: {
          first: { type: GraphQLInt },
          after: { type: GraphQLString },
          filter: { type: NotificationFilterEnum },
        },
        resolve: resolvers.Query.notifications,
      },
      activityFeed: {
        type: new GraphQLNonNull(ActivityConnectionType),
        args: {
          first: { type: GraphQLInt },
          after: { type: GraphQLString },
          filter: { type: ActivityFilterEnum },
        },
        resolve: resolvers.Query.activityFeed,
      },
    },
  });

  // Mutation payload types
  const StarContainerPayloadType = new GraphQLObjectType({
    name: "StarContainerPayload",
    fields: {
      container: { type: ContainerType },
      errors: { type: new GraphQLList(new GraphQLNonNull(ErrorType)) },
    },
  });

  const UnstarContainerPayloadType = new GraphQLObjectType({
    name: "UnstarContainerPayload",
    fields: {
      container: { type: ContainerType },
      errors: { type: new GraphQLList(new GraphQLNonNull(ErrorType)) },
    },
  });

  const FollowUserPayloadType = new GraphQLObjectType({
    name: "FollowUserPayload",
    fields: {
      user: { type: UserType },
      errors: { type: new GraphQLList(new GraphQLNonNull(ErrorType)) },
    },
  });

  const UnfollowUserPayloadType = new GraphQLObjectType({
    name: "UnfollowUserPayload",
    fields: {
      user: { type: UserType },
      errors: { type: new GraphQLList(new GraphQLNonNull(ErrorType)) },
    },
  });

  const MarkNotificationReadPayloadType = new GraphQLObjectType({
    name: "MarkNotificationReadPayload",
    fields: {
      notification: { type: NotificationType },
      errors: { type: new GraphQLList(new GraphQLNonNull(ErrorType)) },
    },
  });

  const MarkAllNotificationsReadPayloadType = new GraphQLObjectType({
    name: "MarkAllNotificationsReadPayload",
    fields: {
      success: { type: new GraphQLNonNull(GraphQLBoolean) },
      errors: { type: new GraphQLList(new GraphQLNonNull(ErrorType)) },
    },
  });

  // Mutation type
  const MutationType = new GraphQLObjectType({
    name: "Mutation",
    fields: {
      starContainer: {
        type: new GraphQLNonNull(StarContainerPayloadType),
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: resolvers.Mutation.starContainer,
      },
      unstarContainer: {
        type: new GraphQLNonNull(UnstarContainerPayloadType),
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: resolvers.Mutation.unstarContainer,
      },
      followUser: {
        type: new GraphQLNonNull(FollowUserPayloadType),
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: resolvers.Mutation.followUser,
      },
      unfollowUser: {
        type: new GraphQLNonNull(UnfollowUserPayloadType),
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: resolvers.Mutation.unfollowUser,
      },
      markNotificationRead: {
        type: new GraphQLNonNull(MarkNotificationReadPayloadType),
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) },
        },
        resolve: resolvers.Mutation.markNotificationRead,
      },
      markAllNotificationsRead: {
        type: new GraphQLNonNull(MarkAllNotificationsReadPayloadType),
        resolve: resolvers.Mutation.markAllNotificationsRead,
      },
    },
  });

  schema = new GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
  });

  return schema;
}

async function handleGraphQL(req: NextRequest) {
  try {
    const userId = getUserIdFromToken(req.headers.get("authorization"));
    const body = await req.json();
    const { query, variables, operationName } = body;

    if (!query) {
      return NextResponse.json(
        { errors: [{ message: "Query is required" }] },
        { status: 400 }
      );
    }

    const schema = buildSchema();
    let document: DocumentNode;

    try {
      document = parse(query);
    } catch (syntaxError) {
      return NextResponse.json(
        { errors: [{ message: `Syntax Error: ${(syntaxError as Error).message}` }] },
        { status: 400 }
      );
    }

    const validationErrors = validate(schema, document);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors.map((e) => ({ message: e.message })) },
        { status: 400 }
      );
    }

    const result = await execute({
      schema,
      document,
      variableValues: variables,
      operationName,
      contextValue: { userId },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GraphQL error:", error);
    return NextResponse.json(
      { errors: [{ message: "Internal server error" }] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleGraphQL(req);
}

export async function GET(req: NextRequest) {
  // GraphiQL interface for development
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>GitChain GraphQL</title>
  <link href="https://unpkg.com/graphiql/graphiql.min.css" rel="stylesheet" />
</head>
<body style="margin: 0;">
  <div id="graphiql" style="height: 100vh;"></div>
  <script crossorigin src="https://unpkg.com/react/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql/graphiql.min.js"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: '/api/graphql' });
    ReactDOM.render(
      React.createElement(GraphiQL, { fetcher }),
      document.getElementById('graphiql'),
    );
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
