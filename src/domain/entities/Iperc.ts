export interface IArea {
  id: string;
  name: string;
  description?: string;
}

export interface ISubarea {
  id: string;
  areaId: string;
  name: string;
}

export interface IIpercHazard {
  id: string;
  versionId: string;
  code: string;
  description: string;
  riskLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  controls: string[];
}

export interface IIpercVersion {
  id: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

export class Area implements IArea {
  constructor(
    public id: string,
    public name: string,
    public description?: string
  ) {}
}

export class IpercHazard implements IIpercHazard {
  constructor(
    public id: string,
    public versionId: string,
    public code: string,
    public description: string,
    public riskLevel: 'ALTO' | 'MEDIO' | 'BAJO',
    public controls: string[] = []
  ) {}
}
