import {
    Client,
    Message,
    TextChannel,
    Guild,
    User,
    GuildMember,
    PermissionString,
    Collection,
    Collector,
    Snowflake,
    APIMessageContentResolvable,
    MessageAdditions,
    MessageOptions,
} from "discord.js"
import { Document, FilterQuery, Model } from "mongoose"
import NodeCache from "node-cache"
import EventEmitter from "events"

declare namespace ServerStat {
    type CommandPermission = PermissionString | "OWNER" | "DEV"

    type CommandOptionFunction = (
        options: CommandExecuteOptions,
        inputs: string | string[],
        index?: number
    ) => void

    type Transform = (oldValue: any) => any | Promise<any>
    type SettingsCollection = Collection<string, Model<any>>

    type InputType = "BUTTON" | "REACTION"
    type InputFilter = (...args: any) => boolean
    type InputHandler = (...args: any) => any | any[]

    type MessagePagesContent =
        | APIMessageContentResolvable
        | MessageAdditions
        | MessageOptions

    interface Translations {
        [key: string]: string
    }

    interface TranslationsDictionary {
        [key: string]: Translations
    }

    interface Transactions {
        [key: string]: boolean
    }

    interface CommandArgument {
        name: string
        descId?: string
        optional?: boolean
        multiple?: boolean
    }

    interface CommandOptionBranch {
        _value?: boolean
        _extends?: boolean
        _optional?: boolean

        _hasVarient?: boolean
        _varientKey?: string
        _varient?: CommandOptionFunction

        _aliases?: string[]
        _linkedAliases?: {
            [key: string]: string
        }

        _shortname?: string

        [key: string]: (CommandOptionBranch | boolean) | any
    }

    interface CommandOptionTree {
        [key: string]: CommandOptionBranch | boolean
    }

    interface CommandOptionTreeFunctions {
        [key: string]: CommandOptionFunction
    }

    interface CommandOptions {
        name: string
        descId?: string
        timeout?: number
        private?: boolean
        args?: CommandArgument[]
        optionTree?: CommandOptionTree
    }

    interface CommandExecuteOptions {
        client: Client

        message: Message
        channel: TextChannel
        guild: Guild

        author: User
        member: GuildMember

        inputs: string[]

        settings: GuildSettings
        prefix: string

        lang: Translations
        locale: string
    }

    interface MessageBaseOptions {
        channel?: TextChannel
        message?: Message
    }

    interface MessagePagesOptions extends MessageBaseOptions {
        user?: User
        pages?: MessagePagesContent[]
        maxTime?: number
        idleTimeout?: number
    }

    interface ImageManagers {
        [key: string]: ImageManager
    }

    class Base {
        constructor(client: Client)

        public readonly client: Client

        public getClient(): Client
    }

    class CommandBase extends Base {
        constructor(client: Client, data: CommandOptions)

        private readonly data: CommandOptions
        public readonly name: string
        public readonly descId: string
        public readonly args: CommandArgument[]
        public readonly private: boolean
        public readonly timeout?: number

        private optionTree?: CommandOptionTree
        private optionTreeFuncs: CommandOptionTreeFunctions

        public aliases(): string[]

        public arguments(): CommandArgument[]
        public numOfArguments(): number
        public requiredArguments(): CommandArgument[]
        public numOfRequiredArguments(): number

        public permissions(): CommandPermission[]
        public tags(): string[]
        public hasTag(tagName: string): boolean

        public hasOptionTree(): boolean
        public getOptionTree(): CommandOptionTree
        private getOptionPath(optionPath: string): CommandOptionBranch
        public setOptionFunc(
            optionPath: string,
            func: CommandOptionFunction,
            direct?: boolean
        ): void
        public executeOptionTree(options: CommandExecuteOptions): void
        public execute(options: CommandExecuteOptions): void
    }

    class CommandExecutor extends Base {
        private commandUsageCache: NodeCache
        private commandTimeoutCache: NodeCache

        public isWithinUsage(user: User): boolean

        private getTimeoutKey(command: CommandBase, user: User): string
        public getTimeoutLeft(command: CommandBase, user: User): number
        public isInTimeout(command: CommandBase, user: User): boolean

        public execute(
            message: Message,
            command: CommandBase,
            inputs: string[]
        ): void
    }

    class CommandParser extends Base {
        private executor: CommandExecutor

        public parse(message: Message): void
    }

    class Settings {
        constructor()

        private transactions: Transactions
        private cache: NodeCache

        private isSetting(name: string): void | Promise<void>
        public get(name: string): Promise<any>
        public set(name: string, value: any): void
        public update(name: string, transform: Transform): void
        public clear(): void
    }

    class GuildSettings extends Settings {
        public static cleanup(guilds: Guild[]): void

        constructor(guild: Guild)

        private guild: Guild
        private models: {
            collection: SettingsCollection
            loaded: boolean
        }
        private settings: SettingsCollection

        public search(
            name: string,
            query: FilterQuery<any>
        ): Promise<Document | Document[]>
        public get(name: string, key?: string): Promise<Document>
        public set(name: string, value: Document | any, key?: string): void
    }

    class GlobalSettings extends Settings {
        private model: Model<any>
    }

    class InputManager extends EventEmitter {
        constructor(message: Message, filter: InputFilter)

        private filter: InputFilter
        public readonly message: Message
        private collector: Collector<Snowflake, any>
        public readonly deleted: boolean

        private _handleInput: InputHandler
        public setCollector(collector: Collector<Snowflake, any>): this
        public delete(): this

        public on(event: "input", listener: (...args: any[]) => void): this
        public on(event: "end" | "delete", listener: () => void): this

        public once(event: "input", listener: (...args: any[]) => void): this
        public once(event: "end" | "delete", listener: () => void): this
    }

    class ButtonInputManager extends InputManager {
        public readonly type = "BUTTON"

        public start(maxTime: number, idleTimeout: number): this
    }

    class ReactionInputManager extends InputManager {
        public readonly type = "REACTION"

        public start(maxTime: number, idleTimeout: number): this
    }

    class MessageBase {
        constructor(data: MessageBaseOptions)

        protected channel?: TextChannel
        protected message?: Message
        public readonly sent: boolean
        public readonly deleted: boolean

        protected send(
            content: APIMessageContentResolvable,
            channel?: TextChannel
        ): this
        public delete(): this
    }

    class MessagePages extends MessageBase {
        constructor(data: MessagePagesOptions)

        protected user?: User
        public readonly pages: MessagePagesContent[]
        protected currentPage?: MessagePagesContent
        protected currentPageIndex: number
        public maxTime: number
        public idleTimeout: number

        public addPages(...pages: MessagePagesContent[]): this
        public addPages(page: MessagePagesContent): this
        public dumpPages(remove?: boolean): this
        public setCurrentPage(index: number): this
        public setMaxTime(maxTime?: number): this
        public setIdleTimeout(idleTimeout?: number): this

        protected send(
            content: APIMessageContentResolvable,
            channel?: TextChannel
        ): this
        protected send(
            channel?: TextChannel,
            user?: User,
            pageIndex?: number
        ): this
    }

    class ImageManager {
        private static managers: ImageManagers
        public static getManager(name: string, ttl?: number): ImageManager

        constructor(stdTTL?: number)

        private readonly stdTTL: number
        private cache: NodeCache

        public get(key: NodeCache.Key): any
        public ttl(key: NodeCache.Key, ttl?: number): boolean
        public set(key: NodeCache.Key, value: any, ttl?: number): boolean
    }

    class LocaleManager {
        public static getLang(locale: string): Translations
        public static getLangs(): TranslationsDictionary
    }
}

export = ServerStat
