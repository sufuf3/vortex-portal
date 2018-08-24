export interface Deployment {
  name: string;
  namespace: string;
  labels: any;
  envVars: any;
  containers: Array<DeploymentContainer>;
  networks: Array<DeploymentNetwork>;
  volumes: Array<string>;
  nodeAffinity: Array<string>;
  networkType: string;
  capability: boolean;
  replicas: number;
}

export interface DeploymentRouteGw {
  key?: string;
  dstCIDR: string;
  gateway: string;
}

export interface DeploymentRouteIntf {
  dstCIDR: string;
}

export interface DeploymentContainer {
  key?: string;
  name: string;
  image: string;
  command: Array<string>;
}

export interface DeploymentNetwork {
  key?: string;
  name: string;
  ifName: string;
  vlan: number;
  ipAddress: string;
  netmask: string;
  routesGw: Array<DeploymentRouteGw>;
  routesIntf?: Array<DeploymentRouteIntf>;
}

export interface Controller {
  controllerName: string;
  type: string;
  namespace: string;
  strategy: string;
  createAt: number;
  desiredPod: number;
  currentPod: number;
  availablePod: number;
  labels: any;
}

export interface Controllers {
  [name: string]: Controller;
}
