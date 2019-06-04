declare namespace NState {
  interface State {
    projectConfig: NState.ProjectConfig;
    preset: {
      [index: string]: Pipe.IOptions[];
    };
    tsConfig: any;
  }

  interface ProjectConfig {
    preset?: string;
    libName?: string;
  }
}

declare namespace Pipe {
  /**
   * 管道配置(前端)
   */
  interface IOptions {
    /** 指定方法名，仅在预设模式下有效 */
    method?: string;
    /** 上游名称 */
    prev?: string | string[];
    /** TODO: 上游的别名，目前直接引用自prev，统一后去除 */
    source?: string | string[];
    /** 下游名称 */
    next?: string | string[];
    /** 遍历标识符 */
    key?: string;
    /** 是否作用于worker */
    worker?: boolean;
    /** 是否懒执行 */
    lazy?: boolean;
  }
}

declare namespace Field {
  interface Map {
    [index: string]: Field.PipeModule[];
  }

  interface Env {
    PIPE?: string;
    FIELD?: string;
    PRESET?: string;
    filePath: string;
    [index: string]: any;
  }

  interface BaseInfo {
    env: Field.Env;
    kind?: string;
    desc?: string;
  }

  interface PipeModule extends BaseInfo {
    className: string;
    pipes: Field.PipeNode[];
    methods: string[];
  }

  interface PipeMethodLocation {
    line: number;
    character: number;
    range: number;
  }

  interface PipeNode extends BaseInfo {
    source: string[];
    method: string;
    enable: boolean;
    location: PipeMethodLocation;
    next?: string[];
    key?: string;
    className?: string;
    enableWorker?: boolean;
    lazy?: boolean;
  }

  interface EditInfo {
    action: 'modify';
    pipeNode: Field.PipeNode;
  }
}
