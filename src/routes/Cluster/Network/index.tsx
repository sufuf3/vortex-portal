import * as React from 'react';
import { connect } from 'react-redux';
import { Button, Tag, Icon, Tree, Popconfirm, Card, Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';
import * as moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { find } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InjectedAuthRouterProps } from 'redux-auth-wrapper/history4/redirect';

import * as styles from './styles.module.scss';
import { RootState, RTDispatch } from '@/store/ducks';
import { clusterOperations, clusterSelectors } from '@/store/ducks/cluster';
import { userOperations } from '@/store/ducks/user';
import {
  networkModels,
  networkSelectors,
  networkOperations
} from '@/store/ducks/network';
import * as UserModel from '@/models/User';
import { Nodes } from '@/models/Node';

import NetworkFrom from '@/components/NetworkForm';

const TreeNode = Tree.TreeNode;

interface NetworkState {
  isCreating: boolean;
}

type NetworkProps = OwnProps & InjectedAuthRouterProps;

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
  users: Array<UserModel.User>;
  fetchUsers: () => any;
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
    this.props.fetchUsers();
  }

  protected handleSubmit = (
    data: networkModels.NetworkFields,
    successCB: () => void
  ) => {
    this.props.addNetwork(data).then(() => {
      this.setState({ isCreating: false });
      successCB();
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
        onConfirm={this.props.removeNetwork.bind(this, id)}
      >
        <a href="javascript:;">
          <FormattedMessage id="action.delete" />
        </a>
      </Popconfirm>
    ];
  };

  protected getNetworkInfo = (networks: Array<networkModels.Network>) => {
    return networks.map(network => {
      const owner = find(this.props.users, user => {
        return user.id === network.ownerID;
      });
      const displayName = owner === undefined ? 'none' : owner.displayName;
      return {
        id: network.id,
        name: network.name,
        owner: displayName,
        type: network.type,
        bridgeName: network.bridgeName,
        nodes: network.nodes,
        vlanTags: network.vlanTags
      };
    });
  };

  public render() {
    const { networks } = this.props;
    const networkNames = networks.map(network => network.name);
    const columns: Array<ColumnProps<networkModels.Network>> = [
      {
        title: <FormattedMessage id="network.name" />,
        dataIndex: 'name',
        width: 200
      },
      {
        title: <FormattedMessage id="network.owner" />,
        dataIndex: 'owner'
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
        title: <FormattedMessage id="network.nodes" />,
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
        title: <FormattedMessage id={`network.vlanTags`} />,
        render: (_, record) =>
          record.vlanTags.length === 0 ? (
            <FormattedMessage id="network.noTrunk" />
          ) : (
            this.renderTags(record.vlanTags)
          )
      },
      {
        title: <FormattedMessage id="network.createdAt" />,
        render: (_, record) => moment(record.createdAt).calendar()
      },
      {
        title: 'Action',
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
            dataSource={this.getNetworkInfo(this.props.networks)}
            size="small"
          />
          <Button
            type="dashed"
            className={styles.add}
            onClick={() => this.setState({ isCreating: true })}
          >
            <Icon type="plus" /> <FormattedMessage id="network.add" />
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
    networkError: state.network.error,
    users: state.user.users
  };
};

const mapDispatchToProps = (dispatch: RTDispatch) => ({
  fetchNodes: () => dispatch(clusterOperations.fetchNodes()),
  fetchNetworks: () => dispatch(networkOperations.fetchNetworks()),
  addNetwork: (data: networkModels.NetworkFields) =>
    dispatch(networkOperations.addNetwork(data)),
  removeNetwork: (id: string) => dispatch(networkOperations.removeNetwork(id)),
  fetchUsers: () => dispatch(userOperations.fetchUsers())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Network);
