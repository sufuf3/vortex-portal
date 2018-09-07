import * as React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  Tag,
  Icon,
  Tree,
  Popconfirm,
  Card,
  Table,
  notification
} from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import { InjectedAuthRouterProps } from 'redux-auth-wrapper/history4/redirect';

import * as styles from './styles.module.scss';
import { RootState, RTDispatch } from '@/store/ducks';
import { clusterOperations, clusterSelectors } from '@/store/ducks/cluster';
import {
  networkModels,
  networkSelectors,
  networkOperations
} from '@/store/ducks/network';
import { Nodes } from '@/models/Node';

import NetworkFrom from '@/components/NetworkForm';

const TreeNode = Tree.TreeNode;

interface NetworkState {
  isCreating: boolean;
}

type NetworkProps = OwnProps & InjectedAuthRouterProps & InjectedIntlProps;

interface OwnProps {
  nodes: Nodes;
  nodesWithUsedInterfaces: {
    [node: string]: Array<string>;
  };
  networks: Array<networkModels.Network>;
  isLoading: boolean;
  networkError?: Error | null;
  fetchNodes: () => any;
  fetchNetworks: () => any;
  addNetwork: (data: networkModels.NetworkFields) => any;
  removeNetwork: (id: string) => any;
}

class Network extends React.Component<NetworkProps, NetworkState> {
  constructor(props: NetworkProps) {
    super(props);
    this.state = {
      isCreating: false
    };
  }

  public componentDidMount() {
    this.props.fetchNodes();
    this.props.fetchNetworks();
  }

  protected handleSubmit = (
    data: networkModels.NetworkFields,
    successCB: () => void
  ) => {
    this.props.addNetwork(data).then(() => {
      this.setState({ isCreating: false });
      successCB();
    });

    const { formatMessage } = this.props.intl;
    notification.success({
      message: formatMessage({
        id: 'action.success'
      }),
      description: formatMessage({
        id: 'network.hint.create.success'
      })
    });
  };

  protected handleRemoveNetwork = (id: string) => {
    this.props.removeNetwork(id);

    const { formatMessage } = this.props.intl;
    notification.success({
      message: formatMessage({
        id: 'action.success'
      }),
      description: formatMessage({
        id: 'network.hint.delete.success'
      })
    });
  };

  protected renderTags = (tags: Array<string | number>) => {
    return (
      <div className={styles.tags}>
        {tags.map(text => (
          <Tag className={styles.tag} key={text}>
            {text}
          </Tag>
        ))}
      </div>
    );
  };

  protected renderAction = (id: string) => {
    return [
      <Popconfirm
        key="action.delete"
        title={<FormattedMessage id="action.confirmToDelete" />}
        onConfirm={this.handleRemoveNetwork.bind(this, id)}
      >
        <a href="javascript:;">
          <FormattedMessage id="action.delete" />
        </a>
      </Popconfirm>
    ];
  };

  public render() {
    const { networks } = this.props;
    const networkNames = networks.map(network => network.name);
    const columns: Array<ColumnProps<networkModels.Network>> = [
      {
        title: <FormattedMessage id="name" />,
        dataIndex: 'name'
      },
      {
        title: <FormattedMessage id="network.type" />,
        dataIndex: 'type'
      },
      {
        title: <FormattedMessage id="network.bridgeName" />,
        dataIndex: 'bridgeName'
      },
      {
        title: <FormattedMessage id="node" />,
        render: (_, record) => (
          <Tree showIcon={true} selectable={false}>
            {record.nodes.map((node, idx) => (
              <TreeNode
                title={node.name}
                key={`${node.name}-${idx}`}
                icon={<FontAwesomeIcon icon="server" />}
              >
                {node.physicalInterfaces.map(physicalInterface => (
                  <TreeNode
                    key={`${node.name}-${idx}-${physicalInterface.name}-${
                      physicalInterface.pciID
                    }`}
                    icon={<FontAwesomeIcon icon="plug" />}
                    title={physicalInterface.name || physicalInterface.pciID}
                  />
                ))}
              </TreeNode>
            ))}
          </Tree>
        )
      },
      {
        title: <FormattedMessage id={`network.VLANTags`} />,
        render: (_, record) =>
          record.vlanTags.length === 0 ? (
            <FormattedMessage id="network.noTrunk" />
          ) : (
            this.renderTags(record.vlanTags)
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
            dataSource={networks}
            size="small"
          />
          <Button
            type="dashed"
            className={styles.add}
            onClick={() => this.setState({ isCreating: true })}
          >
            <Icon type="plus" /> <FormattedMessage id="action.add" />
          </Button>
          <NetworkFrom
            visible={this.state.isCreating}
            isLoading={this.props.isLoading}
            onCancel={() => this.setState({ isCreating: false })}
            onSubmit={this.handleSubmit}
            networkNames={networkNames}
            nodes={this.props.nodes}
            nodesWithUsedInterfaces={this.props.nodesWithUsedInterfaces}
          />
        </Card>
      </div>
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    allNodes: state.cluster.allNodes,
    nodes: clusterSelectors.getNodesWithPhysicalInterfaces(state.cluster),
    nodesWithUsedInterfaces: networkSelectors.NodesWithUsedInterface(
      state.network
    ),
    networks: state.network.networks,
    isLoading: state.network.isLoading,
    networkError: state.network.error
  };
};

const mapDispatchToProps = (dispatch: RTDispatch) => ({
  fetchNodes: () => dispatch(clusterOperations.fetchNodes()),
  fetchNetworks: () => dispatch(networkOperations.fetchNetworks()),
  addNetwork: (data: networkModels.NetworkFields) =>
    dispatch(networkOperations.addNetwork(data)),
  removeNetwork: (id: string) => dispatch(networkOperations.removeNetwork(id))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(Network));
