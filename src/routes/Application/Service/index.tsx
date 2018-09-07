import * as React from 'react';
import * as ServiceModel from '@/models/Service';
import { connect } from 'react-redux';
import * as styles from './styles.module.scss';
import {
  Button,
  Icon,
  Tree,
  Tag,
  Popconfirm,
  Card,
  Table,
  notification
} from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as moment from 'moment';
import { injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import { InjectedAuthRouterProps } from 'redux-auth-wrapper/history4/redirect';

import { Dispatch } from 'redux';
import { RootState, RootAction, RTDispatch } from '@/store/ducks';
import { clusterOperations } from '@/store/ducks/cluster';

import ServiceForm from '@/components/ServiceForm';

const TreeNode = Tree.TreeNode;

interface ServiceState {
  visibleModal: boolean;
}

type ServiceProps = OwnProps & InjectedAuthRouterProps & InjectedIntlProps;
interface OwnProps {
  services: Array<ServiceModel.Service>;
  fetchServices: () => any;
  addService: (data: ServiceModel.Service) => any;
  removeService: (id: string) => any;
}

class Service extends React.Component<ServiceProps, ServiceState> {
  constructor(props: ServiceProps) {
    super(props);
    this.state = {
      visibleModal: false
    };
  }

  public componentDidMount() {
    this.props.fetchServices();
  }

  protected showCreate = () => {
    this.setState({ visibleModal: true });
  };

  protected hideCreate = () => {
    this.setState({ visibleModal: false });
  };

  protected handleSubmit = (service: ServiceModel.Service) => {
    this.props.addService(service);
    this.setState({ visibleModal: false });

    const { formatMessage } = this.props.intl;
    notification.success({
      message: formatMessage({
        id: 'action.success'
      }),
      description: formatMessage({
        id: 'service.hint.create.success'
      })
    });
  };

  protected handleRemoveService = (id: string) => {
    this.props.removeService(id);

    const { formatMessage } = this.props.intl;
    notification.success({
      message: formatMessage({
        id: 'action.success'
      }),
      description: formatMessage({
        id: 'service.hint.delete.success'
      })
    });
  };

  protected renderAction = (id: string | undefined) => {
    return [
      <Popconfirm
        key="action.delete"
        title={<FormattedMessage id="action.confirmToDelete" />}
        onConfirm={this.handleRemoveService.bind(this, id)}
      >
        <a href="javascript:;">
          <FormattedMessage id="action.delete" />
        </a>
      </Popconfirm>
    ];
  };

  public render() {
    const { services } = this.props;
    const columns: Array<ColumnProps<ServiceModel.Service>> = [
      {
        title: <FormattedMessage id="name" />,
        dataIndex: 'name'
      },
      {
        title: <FormattedMessage id="namespace" />,
        dataIndex: 'namespace'
      },
      {
        title: <FormattedMessage id="service.type" />,
        dataIndex: 'type'
      },
      {
        title: <FormattedMessage id="service.selectors" />,
        render: (_, record) => (
          <div>
            {Object.keys(record.selector).map((key: string) => (
              <Tag key={key}>{`${key} : ${record.selector[key]}`}</Tag>
            ))}
          </div>
        )
      },
      {
        title: <FormattedMessage id="service.ports" />,
        render: (_, record) => (
          <Tree showIcon={true} selectable={false}>
            {record.ports.map((port: ServiceModel.ServicePort) => (
              <TreeNode
                title={port.name}
                key={port.name}
                icon={<Icon type="tags" />}
              >
                <TreeNode
                  icon={<Icon type="tag-o" />}
                  title={`Target Port: ${port.targetPort}`}
                />
                <TreeNode
                  icon={<Icon type="tag-o" />}
                  title={`Port: ${port.port}`}
                />
                {record.type === 'NodePort' && (
                  <TreeNode
                    icon={<Icon type="tag-o" />}
                    title={`Node Port: ${port.nodePort}`}
                  />
                )}
              </TreeNode>
            ))}
          </Tree>
        )
      },
      {
        title: <FormattedMessage id="createdAt" />,
        render: (_, record) => moment(record.createdAt).calendar()
      },
      {
        title: <FormattedMessage id="action" />,
        key: 'action',
        render: (_, record) => (
          <div className={styles.drawerBottom}>
            {this.renderAction(record.id)}
          </div>
        )
      }
    ];
    return (
      <div>
        <Card>
          <Table
            className={styles.table}
            columns={columns}
            dataSource={services}
            size="small"
          />
          <Button
            type="dashed"
            className={styles.add}
            onClick={this.showCreate}
          >
            <Icon type="plus" /> <FormattedMessage id="service.add" />
          </Button>
          <ServiceForm
            services={services}
            visible={this.state.visibleModal}
            onCancel={this.hideCreate}
            onSubmit={this.handleSubmit}
          />
        </Card>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    services: state.cluster.services
  };
};

const mapDispatchToProps = (dispatch: RTDispatch & Dispatch<RootAction>) => ({
  fetchServices: () => dispatch(clusterOperations.fetchServices()),
  addService: (data: ServiceModel.Service) => {
    dispatch(clusterOperations.addService(data));
  },
  removeService: (id: string) => dispatch(clusterOperations.removeService(id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(Service));
