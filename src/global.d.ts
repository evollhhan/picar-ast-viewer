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
    key?: string;
    className?: string;
    destination?: string;
    enableWorker?: boolean;
    lazy?: boolean;
  }

  interface EditInfo {
    action: 'modify';
    pipeNode: Field.PipeNode;
  }
}
