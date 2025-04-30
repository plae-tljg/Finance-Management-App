

# 财务管理应用开发指南

start the project  

```bash  
npm install -g @react-native-community/cli
npx @react-native-community/cli init FinanceManagementApp

cd android && ./gradlew clean && cd .. && npx react-native run-android
```

## 1. 添加新的业务逻辑和表

### 1.1 领域驱动设计(DDD)步骤

1. 在 `src/domain/entities` 中创建实体：  
```typescript
// src/domain/entities/Investment.ts
export interface Investment {
  id: string;
  name: string;
  type: 'stock' | 'bond' | 'fund';
  amount: number;
  purchaseDate: Date;
  currentValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export class InvestmentEntity implements Investment {
  // ... 实现实体类
}
```

2. 在 `src/domain/repositories` 中创建仓储接口：
```typescript
// src/domain/repositories/InvestmentRepository.ts
export interface InvestmentRepository {
  findById(id: string): Promise<Investment | null>;
  findAll(): Promise<Investment[]>;
  save(investment: Investment): Promise<void>;
  update(investment: Investment): Promise<void>;
  delete(id: string): Promise<void>;
}
```

3. 在 `src/domain/services` 中创建领域服务：
```typescript
// src/domain/services/InvestmentService.ts
export class InvestmentService {
  constructor(
    private investmentRepository: InvestmentRepository,
    private eventBus: EventBus
  ) {}

  async createInvestment(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Investment> {
    const investment = InvestmentEntity.create(data);
    await this.investmentRepository.save(investment);
    await this.eventBus.publish(new InvestmentCreatedEvent(investment));
    return investment;
  }
}
```

4. 在 `src/domain/events` 中创建事件：
```typescript
// src/domain/events/InvestmentEvents.ts
export class InvestmentCreatedEvent implements DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventType: string;
  investment: Investment;

  constructor(investment: Investment) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.eventType = 'InvestmentCreated';
    this.investment = investment;
  }
}
```

### 1.2 数据库实现

1. 在 `src/infrastructure/databases/schemas` 中创建表结构：
```typescript
// src/infrastructure/databases/schemas/investment.schema.ts
export const investmentSchema = `
  CREATE TABLE investments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    purchase_date TEXT NOT NULL,
    current_value REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;
```

2. 在 `src/infrastructure/repositories` 中实现仓储：
```typescript
// src/infrastructure/repositories/SQLiteInvestmentRepository.ts
export class SQLiteInvestmentRepository implements InvestmentRepository {
  constructor(private db: SQLite.Database) {}

  async findById(id: string): Promise<Investment | null> {
    const result = await this.db.executeSql(
      'SELECT * FROM investments WHERE id = ?',
      [id]
    );
    return result.rows.item(0) || null;
  }
  // ... 实现其他方法
}
```

## 2. 数据库和存储初始化

### 2.1 数据库初始化

1. 在 `src/infrastructure/databases` 中创建数据库配置：
```typescript
// src/infrastructure/databases/DatabaseConfig.ts
export class DatabaseConfig {
  static async initialize(): Promise<SQLite.Database> {
    const db = await SQLite.openDatabase('finance.db');
    await this.createTables(db);
    return db;
  }

  private static async createTables(db: SQLite.Database): Promise<void> {
    const schemas = [
      transactionSchema,
      accountSchema,
      categorySchema,
      budgetSchema,
      investmentSchema
    ];

    for (const schema of schemas) {
      await db.executeSql(schema);
    }
  }
}
```

### 2.2 存储初始化

1. 在 `src/infrastructure/storage` 中创建存储配置：
```typescript
// src/infrastructure/storage/StorageConfig.ts
export class StorageConfig {
  static async initialize(): Promise<void> {
    await AsyncStorage.setItem('app_settings', JSON.stringify({
      currency: 'USD',
      theme: 'light',
      language: 'en'
    }));
  }
}
```

## 3. 前端屏幕实现

### 3.1 屏幕组件

1. 在 `src/presentation/screens` 中创建屏幕：
```typescript
// src/presentation/screens/InvestmentScreen.tsx
export const InvestmentScreen: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const investmentService = useInvestmentService();

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    const data = await investmentService.getAllInvestments();
    setInvestments(data);
  };

  return (
    <View>
      <InvestmentList investments={investments} />
      <AddInvestmentButton onPress={handleAddInvestment} />
    </View>
  );
};
```

### 3.2 可复用组件

1. 在 `src/presentation/components` 中创建组件：
```typescript
// src/presentation/components/InvestmentCard.tsx
export const InvestmentCard: React.FC<{ investment: Investment }> = ({ investment }) => {
  return (
    <Card>
      <Card.Title title={investment.name} />
      <Card.Content>
        <Text>Type: {investment.type}</Text>
        <Text>Amount: ${investment.amount}</Text>
        <Text>Current Value: ${investment.currentValue}</Text>
      </Card.Content>
    </Card>
  );
};
```

## 4. 处理变更

### 4.1 状态管理

1. 在 `src/application/store` 中创建 Redux store：
```typescript
// src/application/store/investmentSlice.ts
const investmentSlice = createSlice({
  name: 'investments',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    setInvestments: (state, action) => {
      state.items = action.payload;
    },
    addInvestment: (state, action) => {
      state.items.push(action.payload);
    }
  }
});
```

### 4.2 变更处理

1. 在 `src/application/use-cases` 中创建用例：
```typescript
// src/application/use-cases/UpdateInvestmentUseCase.ts
export class UpdateInvestmentUseCase {
  constructor(
    private investmentService: InvestmentService,
    private eventBus: EventBus
  ) {}

  async execute(id: string, data: Partial<Investment>): Promise<void> {
    const investment = await this.investmentService.updateInvestment(id, data);
    await this.eventBus.publish(new InvestmentUpdatedEvent(investment));
  }
}
```

## 5. 设计原则实践

### 5.1 单一职责原则 (SRP)
- 每个类只负责一个功能
- 例如：`TransactionService` 只处理交易相关逻辑

### 5.2 开闭原则 (OCP)
- 通过继承和接口扩展功能
- 例如：`BaseRepository` 和具体实现

### 5.3 里氏替换原则 (LSP)
- 子类可以替换父类
- 例如：所有仓储实现都可以替换其接口

### 5.4 接口隔离原则 (ISP)
- 接口应该小而专注
- 例如：`TransactionRepository` 只包含交易相关方法

### 5.5 依赖倒置原则 (DIP)
- 依赖抽象而不是具体实现
- 例如：服务依赖仓储接口而不是具体实现

### 5.6 迪米特法则 (LoD)
- 减少对象之间的耦合
- 例如：通过事件总线进行通信

## 6. 文件结构

```
src/
├── domain/                 # 领域层
│   ├── entities/          # 实体
│   ├── value-objects/     # 值对象
│   ├── repositories/      # 仓储接口
│   ├── services/         # 领域服务
│   └── events/           # 领域事件
├── application/           # 应用层
│   ├── use-cases/        # 用例
│   ├── store/           # 状态管理
│   └── dtos/            # 数据传输对象
├── infrastructure/        # 基础设施层
│   ├── databases/       # 数据库配置
│   ├── repositories/    # 仓储实现
│   └── storage/        # 存储配置
└── presentation/         # 表现层
    ├── screens/         # 屏幕组件
    ├── components/      # 可复用组件
    └── navigation/      # 导航配置
```

## 7. 测试策略

### 7.1 单元测试
```typescript
// src/domain/services/__tests__/TransactionService.test.ts
describe('TransactionService', () => {
  it('should create a transaction', async () => {
    const service = new TransactionService(mockRepo, mockEventBus);
    const transaction = await service.createTransaction({
      amount: 100,
      type: 'income',
      categoryId: '1',
      accountId: '1'
    });
    expect(transaction.amount).toBe(100);
  });
});
```

### 7.2 集成测试
```typescript
// src/infrastructure/repositories/__tests__/SQLiteTransactionRepository.test.ts
describe('SQLiteTransactionRepository', () => {
  it('should save and retrieve a transaction', async () => {
    const repo = new SQLiteTransactionRepository(db);
    const transaction = await repo.save(mockTransaction);
    const retrieved = await repo.findById(transaction.id);
    expect(retrieved).toEqual(transaction);
  });
});
```

## 8. 错误处理

### 8.1 领域错误
```typescript
// src/domain/errors/DomainError.ts
export class DomainError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DomainError';
  }
}
```

### 8.2 错误处理中间件
```typescript
// src/presentation/middleware/ErrorHandler.ts
export const errorHandler = (error: Error) => {
  if (error instanceof DomainError) {
    // 处理领域错误
    return {
      message: error.message,
      code: error.code
    };
  }
  // 处理其他错误
  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
};
```