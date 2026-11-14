import React, { useState, useEffect } from 'react';
import { adminAPI, categoryAPI } from '../services/api';
import { UserPlus, Users, Wallet, ExternalLink, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function UserGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupUsers, setGroupUsers] = useState([]);
  const [userAccounts, setUserAccounts] = useState({}); // Store accounts by userId
  const [groupCategories, setGroupCategories] = useState([]); // Store categories for the group
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    groupId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchAllUsers();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUserGroups();
      setGroups(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load user groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setAllUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchGroupUsers = async (groupId) => {
    try {
      const response = await adminAPI.getUsersInGroup(groupId);
      setGroupUsers(response.data);
      setSelectedGroup(groupId);
      
      // Fetch accounts for each user
      const accountsData = {};
      for (const user of response.data) {
        try {
          const accountsResponse = await adminAPI.getUserAccounts(user.id);
          accountsData[user.id] = accountsResponse.data;
        } catch (err) {
          console.error(`Failed to load accounts for user ${user.id}:`, err);
          accountsData[user.id] = [];
        }
      }
      setUserAccounts(accountsData);
      
      // Fetch categories (all categories available to group members)
      await fetchGroupCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group users');
    }
  };
  
  const fetchGroupCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setGroupCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setGroupCategories([]);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminAPI.createUserGroup(formData);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      setError('');
      toast.success('Group created successfully');
      await fetchGroups(); // Automatically refresh groups
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const userData = {
        username: userFormData.username,
        email: userFormData.email,
        password: userFormData.password,
        firstName: userFormData.firstName,
        lastName: userFormData.lastName
      };
      
      const response = await adminAPI.createUser(userData);
      const newUser = response.data;
      
      // If a group is selected, assign the user to that group
      if (userFormData.groupId) {
        await adminAPI.assignUserToGroup(newUser.id, userFormData.groupId);
        // Refresh group users if viewing that group
        if (selectedGroup === parseInt(userFormData.groupId)) {
          await fetchGroupUsers(selectedGroup);
        }
      }
      
      setUserFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        groupId: ''
      });
      setShowCreateUserForm(false);
      setError('');
      await fetchAllUsers(); // Automatically refresh all users
      toast.success('User created successfully' + (userFormData.groupId ? ' and added to group' : ''));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToGroup = async (userId, groupId) => {
    try {
      await adminAPI.assignUserToGroup(userId, groupId);
      toast.success('User assigned to group');
      if (selectedGroup === groupId) {
        await fetchGroupUsers(groupId);
      }
      await fetchAllUsers(); // Refresh all users list
    } catch (err) {
      toast.error('Failed to assign user to group');
    }
  };

  return (
    <div className="user-groups-wrapper">
      <div className="groups-header">
        <h2 className="groups-title">User Groups Management</h2>
        <div className="groups-actions">
          <button
            onClick={() => {
              setShowCreateUserForm(!showCreateUserForm);
              setShowCreateForm(false);
            }}
            className="groups-btn groups-btn-user"
          >
            <UserPlus size={20} />
            <span>{showCreateUserForm ? 'Cancel' : 'Create User'}</span>
          </button>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowCreateUserForm(false);
            }}
            className="groups-btn groups-btn-group"
          >
            <Users size={20} />
            <span>{showCreateForm ? 'Cancel' : 'Create Group'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="groups-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {showCreateUserForm && (
        <form onSubmit={handleCreateUser} className="groups-form user-form">
          <h3 className="form-title">
            <UserPlus size={24} className="form-title-icon" />
            Create New User
          </h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Username *</label>
              <input
                type="text"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Email *</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Password *</label>
              <input
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                className="form-input"
                required
                minLength="6"
              />
            </div>
            <div className="form-field">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                value={userFormData.firstName}
                onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                value={userFormData.lastName}
                onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Assign to Group (Optional)</label>
              <select
                value={userFormData.groupId}
                onChange={(e) => setUserFormData({ ...userFormData, groupId: e.target.value })}
                className="form-input"
              >
                <option value="">-- No Group --</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="form-submit user-submit"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateGroup} className="groups-form group-form">
          <h3 className="form-title">
            <Users size={24} className="form-title-icon" />
            Create New Group
          </h3>
          <div className="form-field">
            <label className="form-label">Group Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input form-textarea"
              rows="3"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="form-submit group-submit"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      )}

      <div className="groups-container">
        <div className="groups-list-panel">
          <h3 className="panel-title">
            <Users size={20} className="panel-icon" />
            Groups List
          </h3>
          {loading && <p className="panel-message">Loading...</p>}
          {!loading && groups.length === 0 && (
            <p className="panel-message">No groups created yet.</p>
          )}
          <div className="groups-list">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => fetchGroupUsers(group.id)}
                className={`group-card ${selectedGroup === group.id ? 'group-card-active' : ''}`}
              >
                <h4 className="group-name">{group.name}</h4>
                {group.description && (
                  <p className="group-description">{group.description}</p>
                )}
                <p className="group-date">
                  Created: {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="groups-members-panel">
          <h3 className="panel-title">
            <UserPlus size={20} className="panel-icon" />
            Group Members
          </h3>
          {!selectedGroup && (
            <p className="panel-message">Select a group to view members</p>
          )}
          {selectedGroup && (
            <>
              {groupUsers.length === 0 && (
                <div>
                  <p className="panel-message mb-members-empty">No users in this group</p>
                  <div className="add-users-section">
                    <h4 className="add-users-title">Add Existing Users:</h4>
                    <div className="user-list">
                      {allUsers
                        .filter(user => !groupUsers.find(gu => gu.id === user.id))
                        .filter(user => user.role === 'ROLE_USER')
                        .map((user) => (
                          <div key={user.id} className="user-item">
                            <div className="user-info">
                              <p className="user-name">{user.username}</p>
                              <p className="user-email">{user.email}</p>
                            </div>
                            <button
                              onClick={() => handleAssignToGroup(user.id, selectedGroup)}
                              className="user-add-btn"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
              {groupUsers.length > 0 && (
                <>
                  <div className="members-list">
                    {groupUsers.map((user) => {
                      const accounts = userAccounts[user.id] || [];
                      const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
                      
                      return (
                        <div key={user.id} className="member-card">
                          <div className="member-header">
                            <div className="member-info">
                              <p className="member-username">{user.username}</p>
                              <p className="member-email">{user.email}</p>
                            </div>
                            <div className="member-details">
                              <div className="member-name">
                                {user.firstName} {user.lastName}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="add-users-section">
                    <h4 className="add-users-title">Add More Users:</h4>
                    <div className="user-list">
                      {allUsers
                        .filter(user => !groupUsers.find(gu => gu.id === user.id))
                        .filter(user => user.role === 'ROLE_USER')
                        .map((user) => (
                          <div key={user.id} className="user-item">
                            <div className="user-info">
                              <p className="user-name">{user.username}</p>
                              <p className="user-email">{user.email}</p>
                            </div>
                            <button
                              onClick={() => handleAssignToGroup(user.id, selectedGroup)}
                              className="user-add-btn"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      {allUsers.filter(user => !groupUsers.find(gu => gu.id === user.id) && user.role === 'ROLE_USER').length === 0 && (
                        <p className="no-users-message">No more users available to add</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Group Categories Section */}
                  {groupCategories.length > 0 && (
                    <div className="group-categories-section">
                      <h4 className="add-users-title">
                        <Tag size={18} className="inline mr-2" />
                        Available Categories for Group
                      </h4>
                      <div className="categories-grid">
                        {groupCategories.map((category) => (
                          <div
                            key={category.id}
                            className="category-badge"
                            style={{ borderLeftColor: category.color || '#3B82F6' }}
                          >
                            <div
                              className="category-color-dot"
                              style={{ backgroundColor: category.color || '#3B82F6' }}
                            />
                            <div className="category-details">
                              <span className="category-name">{category.name}</span>
                              {category.isDefault && (
                                <span className="category-default-badge">Default</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="categories-note">
                        These categories are available to all members of this group. Members can also create their own custom categories.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <style>{`
        .user-groups-wrapper {
          padding: 1.5rem;
          position: relative;
          min-height: 100vh;
        }
        
        .user-groups-wrapper::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 25%, #fae8ff 50%, #fce7f3 75%, #ffe4e6 100%);
          z-index: -1;
          animation: gradientShift 20s ease infinite;
        }
        
        @keyframes gradientShift {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05);
          }
        }
        
        .groups-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
          animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%);
          padding: 1.5rem 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 2px solid rgba(255, 255, 255, 0.6);
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .groups-title {
          font-size: 2.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 30%, #d946ef 60%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
          position: relative;
          animation: titleGlow 3s ease-in-out infinite;
        }
        
        @keyframes titleGlow {
          0%, 100% {
            filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.3));
          }
          50% {
            filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.4));
          }
        }
        
        .groups-actions {
          display: flex;
          gap: 1rem;
        }
        
        .groups-btn {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1.75rem;
          border-radius: 16px;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .groups-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .groups-btn:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .groups-btn-user {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          color: white;
        }
        
        .groups-btn-user:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
        }
        
        .groups-btn-user:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .groups-btn-group {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
          color: white;
        }
        
        .groups-btn-group:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
        }
        
        .groups-btn-group:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .groups-error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%);
          border-left: 5px solid #dc2626;
          color: #991b1b;
          padding: 1.25rem 1.75rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 600;
          animation: shake 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97);
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.2);
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        
        .error-icon {
          font-size: 1.5rem;
        }
        
        .groups-form {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(20px);
          padding: 2.5rem;
          border-radius: 24px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          margin-bottom: 2.5rem;
          border: 2px solid rgba(255, 255, 255, 0.4);
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        
        .groups-form::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef, #ec4899);
          animation: slideRight 3s linear infinite;
        }
        
        @keyframes slideRight {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .user-form {
          border-top: 5px solid #10b981;
        }
        
        .user-form::before {
          background: linear-gradient(90deg, #10b981, #059669, #047857, #10b981);
        }
        
        .group-form {
          border-top: 5px solid #3b82f6;
        }
        
        .group-form::before {
          background: linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8, #3b82f6);
        }
        
        .form-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.875rem;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .form-title-icon {
          color: #8b5cf6;
          filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3));
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .form-field {
          margin-bottom: 1.25rem;
        }
        
        .form-label {
          display: block;
          font-weight: 700;
          color: #374151;
          margin-bottom: 0.625rem;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
        }
        
        .form-input {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border: 2.5px solid #e5e7eb;
          border-radius: 14px;
          font-size: 1rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: white;
          font-weight: 500;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15), 0 4px 12px rgba(139, 92, 246, 0.1);
          transform: translateY(-2px);
        }
        
        .form-input:hover {
          border-color: #d1d5db;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
        }
        
        .form-submit {
          padding: 1rem 2.5rem;
          border-radius: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-size: 1.05rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }
        
        .form-submit::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .form-submit:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .user-submit {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          color: white;
        }
        
        .user-submit:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
        }
        
        .user-submit:active:not(:disabled) {
          transform: translateY(-1px) scale(0.98);
        }
        
        .group-submit {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
          color: white;
        }
        
        .group-submit:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
        }
        
        .group-submit:active:not(:disabled) {
          transform: translateY(-1px) scale(0.98);
        }
        
        .form-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .groups-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 2rem;
        }
        
        .groups-list-panel,
        .groups-members-panel {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
          border: 2px solid rgba(255, 255, 255, 0.4);
          animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1);
          transition: all 0.4s ease;
        }
        
        .groups-list-panel:hover,
        .groups-members-panel:hover {
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
          transform: translateY(-4px);
        }
        
        .panel-title {
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 1.75rem;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          padding-bottom: 1rem;
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, #8b5cf6, #d946ef, #ec4899) 1;
        }
        
        .panel-icon {
          color: #8b5cf6;
          filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3));
          animation: iconBounce 2s ease-in-out infinite;
        }
        
        @keyframes iconBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        
        .panel-message {
          color: #6b7280;
          text-align: center;
          padding: 3rem 1rem;
          font-style: italic;
          font-size: 1.05rem;
          font-weight: 500;
        }
        
        .mb-members-empty {
          margin-bottom: 2rem;
        }
        
        .groups-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 600px;
          overflow-y: auto;
          padding-right: 0.75rem;
        }
        
        .groups-list::-webkit-scrollbar {
          width: 8px;
        }
        
        .groups-list::-webkit-scrollbar-track {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 12px;
        }
        
        .groups-list::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #d946ef 100%);
          border-radius: 12px;
          box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.2);
        }
        
        .groups-list::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #c026d3 100%);
        }
        
        .group-card {
          padding: 1.5rem;
          border: 2.5px solid #e5e7eb;
          border-radius: 18px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          position: relative;
          overflow: hidden;
        }
        
        .group-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent);
          transition: left 0.5s ease;
        }
        
        .group-card:hover::before {
          left: 100%;
        }
        
        .group-card:hover {
          border-color: #8b5cf6;
          transform: translateX(6px) translateY(-2px);
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.25);
        }
        
        .group-card-active {
          background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #c4b5fd 100%);
          border-color: #8b5cf6;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
          transform: translateX(4px);
        }
        
        .group-card-active::after {
          content: '✓';
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
        }
        
        .group-name {
          font-weight: 800;
          color: #1f2937;
          font-size: 1.2rem;
          margin-bottom: 0.625rem;
          letter-spacing: -0.3px;
        }
        
        .group-description {
          font-size: 0.95rem;
          color: #6b7280;
          margin-top: 0.625rem;
          line-height: 1.6;
          font-weight: 500;
        }
        
        .group-date {
          font-size: 0.85rem;
          color: #9ca3af;
          margin-top: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .group-date::before {
          content: '📅';
          font-size: 0.875rem;
        }
        
        .members-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .member-card {
          padding: 1.5rem;
          border: 2.5px solid #e5e7eb;
          border-radius: 18px;
          background: linear-gradient(135deg, #fafafa 0%, #f9fafb 50%, #ffffff 100%);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        
        .member-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, #8b5cf6, #d946ef, #ec4899);
          transform: scaleY(0);
          transition: transform 0.4s ease;
        }
        
        .member-card:hover::before {
          transform: scaleY(1);
        }
        
        .member-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.2);
          transform: translateY(-3px) translateX(4px);
        }
        
        .member-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .member-info {
          flex: 1;
        }
        
        .member-username {
          font-weight: 800;
          color: #1f2937;
          font-size: 1.1rem;
          letter-spacing: -0.2px;
          margin-bottom: 0.375rem;
        }
        
        .member-email {
          font-size: 0.9rem;
          color: #6b7280;
          margin-top: 0.375rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .member-email::before {
          content: '✉️';
          font-size: 0.875rem;
        }
        
        .member-details {
          text-align: right;
        }
        
        .member-name {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 600;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          border: 1px solid #d1d5db;
        }
        
        .add-users-section {
          border-top: 3px solid transparent;
          border-image: linear-gradient(90deg, #e5e7eb, #d1d5db, #e5e7eb) 1;
          padding-top: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .add-users-title {
          font-weight: 800;
          margin-bottom: 1rem;
          font-size: 1.05rem;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .add-users-title::before {
          content: '➕';
          font-size: 1rem;
        }
        
        .user-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 320px;
          overflow-y: auto;
          padding-right: 0.75rem;
        }
        
        .user-list::-webkit-scrollbar {
          width: 8px;
        }
        
        .user-list::-webkit-scrollbar-track {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 12px;
        }
        
        .user-list::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
          border-radius: 12px;
          box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.2);
        }
        
        .user-list::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%);
        }
        
        .user-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border: 2.5px solid #e5e7eb;
          border-radius: 14px;
          background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        
        .user-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.08), transparent);
          transition: left 0.5s ease;
        }
        
        .user-item:hover::before {
          left: 100%;
        }
        
        .user-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
          transform: translateX(4px);
        }
        
        .user-info {
          flex: 1;
        }
        
        .user-name {
          font-weight: 700;
          color: #1f2937;
          font-size: 0.975rem;
          letter-spacing: -0.2px;
        }
        
        .user-email {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 0.25rem;
          font-weight: 500;
        }
        
        .user-add-btn {
          padding: 0.625rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .user-add-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .user-add-btn:hover::before {
          width: 200px;
          height: 200px;
        }
        
        .user-add-btn:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }
        
        .user-add-btn:active {
          transform: translateY(-1px) scale(0.98);
        }
        
        .no-users-message {
          font-size: 0.975rem;
          color: #9ca3af;
          text-align: center;
          padding: 2rem 1rem;
          font-style: italic;
          font-weight: 500;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-radius: 14px;
          border: 2px dashed #d1d5db;
        }
        
        /* Group Categories Section */
        .group-categories-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 250, 251, 0.95) 100%);
          border-radius: 16px;
          border: 2px solid rgba(139, 92, 246, 0.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
        }
        
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
          margin: 1rem 0;
        }
        
        .category-badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: white;
          border-radius: 10px;
          border: 2px solid #e5e7eb;
          border-left-width: 4px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .category-badge:hover {
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .category-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .category-details {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .category-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
        }
        
        .category-default-badge {
          font-size: 0.65rem;
          padding: 0.125rem 0.5rem;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
          border-radius: 6px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .categories-note {
          margin-top: 1rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-left: 4px solid #3b82f6;
          border-radius: 8px;
          font-size: 0.85rem;
          color: #1e40af;
          font-style: italic;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}

export default UserGroups;
