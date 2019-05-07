declare namespace Field {
  interface Map {
    [index: string]: Field.PipeModule[];
  }

  interface Env {
    PIPE: string;
    FIELD: string;
    filePath: string;
    [index: string]: any;
  }

  interface PipeModule {
    className: string;
    pipes: Field.PipeNode[];
    env: Field.Env;
  }

  interface PipeMethodLocation {
    line: number;
    character: number;
    range: number;
  }

  interface PipeNode {
    source: string[];
    method: string;
    enable: boolean;
    env: Field.Env;
    key?: string;
    className?: string;
    destination?: string;
    enableWorker?: boolean;
    lazy?: boolean;
    location: PipeMethodLocation;
  }
}
